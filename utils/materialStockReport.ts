import { domain } from '@/lib/domain';
import { getAuthHeaders } from '@/utils/axiosConfig';

export interface MaterialStockRow {
  name: string;
  unit: string;
  specs: Record<string, any>;
  totalImported: number;
  totalUsed: number;
  currentlyAvailable: number;
  perUnitCost: number;
  totalCost: number;
  vendors: string[];
}

// Specs are part of a material's identity (grade/size/brand), so they're folded
// into the grouping key in a stable, order-independent form.
export const buildSpecsKey = (specs: any): string => {
  if (!specs || typeof specs !== 'object' || Object.keys(specs).length === 0) return '';
  return Object.keys(specs)
    .sort()
    .filter(k => specs[k] !== null && specs[k] !== undefined && specs[k] !== '')
    .map(k => `${k}:${specs[k]}`)
    .join('|');
};

/**
 * Loads every available and used material for a project and groups them by
 * name + unit + specs for the material stock report, including each material's
 * vendors (from the material records and the project's "imported" activity log).
 *
 * Uses fetch rather than apiClient: the activity endpoint returns the project's
 * whole log unpaginated, which can outlast apiClient's 15s timeout.
 */
export const fetchMaterialStockRows = async (projectId: string, clientId: string): Promise<MaterialStockRow[]> => {
  if (!clientId || !projectId) throw new Error('Missing project or client information');

  // API caps `limit` at 5000 server-side — large enough to cover a project's full
  // material list in a single request instead of paging through it.
  const REPORT_LIMIT = 5000;
  const buildQueryString = (extra: Record<string, any> = {}) => {
    const queryParams = { projectId, clientId, page: 1, limit: REPORT_LIMIT, sortBy: 'createdAt', sortOrder: 'desc', ...extra };
    return Object.entries(queryParams)
      .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
      .join('&');
  };

  const [availableResponse, usedResponse] = await Promise.all([
    fetch(`${domain}/api/material?${buildQueryString()}`, { method: 'GET', headers: { ...getAuthHeaders() } }),
    fetch(`${domain}/api/material-usage?${buildQueryString()}`, { method: 'GET', headers: { ...getAuthHeaders() } }),
  ]);
  if (!availableResponse.ok) throw new Error(`Available materials API failed: ${availableResponse.status}`);
  if (!usedResponse.ok) throw new Error(`Used materials API failed: ${usedResponse.status}`);

  const availableData = await availableResponse.json();
  const usedData = await usedResponse.json();
  const availableList: any[] = availableData.MaterialAvailable || availableData.materials || [];
  const usedList: any[] = usedData.MaterialUsed || usedData.materials || [];

  const grouped: { [key: string]: { name: string; unit: string; specs: Record<string, any>; currentlyAvailable: number; totalUsed: number; importedCost: number; vendors: Set<string> } } = {};
  const getGroup = (entryName: string, entryUnit: string, entrySpecs: any) => {
    const key = `${entryName}-${entryUnit}-${buildSpecsKey(entrySpecs)}`;
    if (!grouped[key]) {
      grouped[key] = { name: entryName, unit: entryUnit, specs: entrySpecs || {}, currentlyAvailable: 0, totalUsed: 0, importedCost: 0, vendors: new Set() };
    }
    return grouped[key];
  };

  const addVendor = (group: { vendors: Set<string> }, vendor: any) => {
    const v = typeof vendor === 'string' ? vendor.trim() : '';
    if (v) group.vendors.add(v);
  };

  const resolveCost = (m: any, qty: number) => {
    if (m.totalCost !== undefined && m.totalCost !== null) return Number(m.totalCost);
    return Number(m.perUnitCost ?? m.cost ?? 0) * qty;
  };

  availableList.forEach((m) => {
    const qty = Number(m.qnt || 0);
    const group = getGroup(m.name, m.unit, m.specs);
    group.currentlyAvailable += qty;
    group.importedCost += resolveCost(m, qty);
    addVendor(group, m.contractor_name);
  });
  usedList.forEach((m) => {
    const qty = Number(m.qnt || 0);
    const group = getGroup(m.name, m.unit, m.specs);
    group.totalUsed += qty;
    group.importedCost += resolveCost(m, qty);
    addVendor(group, m.contractor_name);
  });

  // Vendors are also read from the "imported" activity log, which keeps every
  // purchase's vendor even after its stock record has been fully used.
  try {
    const activityRes = await fetch(
      `${domain}/api/materialActivity?projectId=${projectId}&activity=imported&clientId=${clientId}&limit=${REPORT_LIMIT}`,
      { method: 'GET', headers: { ...getAuthHeaders() } }
    );
    if (activityRes.ok) {
      const activityData = await activityRes.json();
      const activities: any[] = activityData.data?.activities || activityData.activities || [];
      const groups = Object.values(grouped);
      activities.forEach((act) => {
        (act.materials || []).forEach((m: any) => {
          const exact = grouped[`${m.name}-${m.unit}-${buildSpecsKey(m.specs)}`];
          // Fall back to name + unit when the activity's specs were saved differently.
          const targets = exact ? [exact] : groups.filter(g => g.name === m.name && g.unit === m.unit);
          targets.forEach(g => addVendor(g, m.contractor_name || act.contractor_name));
        });
      });
    }
  } catch {
    // non-fatal — vendors from the material records are still shown
  }

  return Object.values(grouped).map(group => {
    const totalImported = group.currentlyAvailable + group.totalUsed;
    return {
      name: group.name,
      unit: group.unit,
      specs: group.specs,
      totalImported,
      totalUsed: group.totalUsed,
      currentlyAvailable: group.currentlyAvailable,
      perUnitCost: totalImported > 0 ? group.importedCost / totalImported : 0,
      totalCost: group.importedCost,
      vendors: Array.from(group.vendors),
    };
  });
};
