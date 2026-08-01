import AsyncStorage from '@react-native-async-storage/async-storage';
import { BillImage } from '@/utils/billUpload';
import type { PaymentStatus } from './PaymentStep';
import { CustomSpec, InternalMaterial, MaterialFormData } from './types';

/**
 * Crash/restart safety net for the Add Material form.
 *
 * Opening the camera puts Xsite in the background, where Android may destroy
 * MainActivity to free memory for the camera app. The JS bundle then reloads and
 * every bit of in-progress form state is gone. The form snapshots itself here
 * right before the picker launches, so on the way back the user is offered their
 * work instead of an empty form.
 *
 * The draft is deliberately short-lived and cleared whenever the form closes
 * normally — it is a recovery mechanism, not a "save for later" feature.
 */

const DRAFT_KEY = '@xsite/material_form_draft';

// Long enough to cover "phone rang / battery died mid-purchase", short enough
// that a week-old draft never resurfaces on an unrelated site visit.
const DRAFT_TTL_MS = 6 * 60 * 60 * 1000; // 6 hours

export interface MaterialDraft {
  savedAt: number;
  currentStep: number;
  addedMaterials: InternalMaterial[];
  formData: MaterialFormData;
  customSpecs: CustomSpec[];
  selectedTemplateKey: string | null;
  purposeMessage: string;
  paymentStatus?: PaymentStatus;
  amountPaid: string;
  billingDate: string;
  billImages: BillImage[];
}

export const saveMaterialDraft = async (
  draft: Omit<MaterialDraft, 'savedAt'>
): Promise<void> => {
  try {
    const payload: MaterialDraft = { ...draft, savedAt: Date.now() };
    await AsyncStorage.setItem(DRAFT_KEY, JSON.stringify(payload));
  } catch (error) {
    // Never let a storage hiccup stop the user from taking the photo.
    console.log('ℹ️ Could not save material draft:', error);
  }
};

export const loadMaterialDraft = async (): Promise<MaterialDraft | null> => {
  try {
    const raw = await AsyncStorage.getItem(DRAFT_KEY);
    if (!raw) return null;

    const draft = JSON.parse(raw) as MaterialDraft;
    if (!draft?.savedAt || Date.now() - draft.savedAt > DRAFT_TTL_MS) {
      await clearMaterialDraft();
      return null;
    }

    // An empty draft has nothing worth prompting about.
    const hasContent =
      draft.addedMaterials?.length > 0 ||
      !!draft.formData?.name ||
      !!draft.formData?.quantity ||
      !!draft.formData?.perUnitCost;
    if (!hasContent) {
      await clearMaterialDraft();
      return null;
    }

    return draft;
  } catch (error) {
    console.log('ℹ️ Could not read material draft:', error);
    return null;
  }
};

export const clearMaterialDraft = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(DRAFT_KEY);
  } catch (error) {
    console.log('ℹ️ Could not clear material draft:', error);
  }
};
