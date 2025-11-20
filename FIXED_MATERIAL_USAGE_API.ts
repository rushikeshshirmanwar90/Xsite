import connect from "@/lib/db";
import { Projects } from "@/lib/models/Project";
import { ObjectId } from "mongodb";
import { Types } from "mongoose";
import { NextRequest, NextResponse } from "next/server";

// Local types matching MaterialSchema
type Specs = Record<string, unknown>;

type MaterialSubdoc = {
  _id?: Types.ObjectId | string;
  name: string;
  unit: string;
  specs?: Specs;
  qnt: number;
  cost?: number;
  sectionId?: string;
  miniSectionId?: string;
};

// GET: Fetch MaterialUsed for a project
export const GET = async (req: NextRequest | Request) => {
  try {
    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get("projectId");
    const clientId = searchParams.get("clientId");
    const sectionId = searchParams.get("sectionId");

    if (!projectId || !clientId) {
      return NextResponse.json(
        {
          message: "Project ID and Client ID are required",
        },
        {
          status: 400,
        }
      );
    }

    await connect();

    const project = await Projects.findOne(
      {
        _id: new ObjectId(projectId),
        clientId: new ObjectId(clientId),
      },
      { MaterialUsed: 1, MaterialAvailable: 1 }
    );

    if (!project) {
      return NextResponse.json(
        {
          message: "Project not found",
        },
        {
          status: 404,
        }
      );
    }

    // Get MaterialUsed array
    const allUsed = project.MaterialUsed || [];

    // If sectionId is provided, filter MaterialUsed to that section
    const filteredUsed = sectionId
      ? allUsed.filter(
          (m: MaterialSubdoc) => String(m.sectionId) === String(sectionId)
        )
      : allUsed;

    return NextResponse.json(
      {
        success: true,
        message: "Material used fetched successfully",
        MaterialUsed: filteredUsed,
      },
      {
        status: 200,
      }
    );
  } catch (error: unknown) {
    console.log(error);
    return NextResponse.json(
      {
        success: false,
        message: "Unable to fetch MaterialUsed",
        error: error instanceof Error ? error.message : String(error),
      },
      {
        status: 500,
      }
    );
  }
};

export const POST = async (req: NextRequest | Request) => {
  try {
    await connect();
    const body = await req.json();
    const { projectId, materialId, qnt, miniSectionId, sectionId } = body;

    console.log('\n========================================');
    console.log('MATERIAL USAGE API - REQUEST');
    console.log('========================================');
    console.log('Body:', JSON.stringify(body, null, 2));
    console.log('========================================\n');

    // Validation
    if (!projectId || !materialId || typeof qnt !== "number" || !sectionId) {
      return NextResponse.json(
        {
          success: false,
          error: "projectId, materialId, sectionId and numeric qnt are required",
        },
        { status: 400 }
      );
    }

    if (qnt <= 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Quantity must be greater than 0",
        },
        { status: 400 }
      );
    }

    // Find project - DON'T use projection, get full document
    const project = await Projects.findById(projectId);
    
    if (!project) {
      console.error("Project not found for ID:", projectId);
      return NextResponse.json(
        { success: false, error: "Project not found" },
        { status: 404 }
      );
    }

    console.log('Project found:', project._id);
    console.log('MaterialAvailable count:', project.MaterialAvailable?.length || 0);

    // Get the plain object to ensure _id is accessible
    const projectObj = project.toObject();
    const availableList = projectObj.MaterialAvailable || [];

    console.log('\n--- Searching for material ---');
    console.log('Requested materialId:', materialId);
    console.log('Requested sectionId:', sectionId);
    console.log('\nAvailable materials:');
    
    availableList.forEach((m: any, idx: number) => {
      console.log(`  ${idx + 1}. ${m.name}:`);
      console.log(`     _id: ${m._id} (type: ${typeof m._id})`);
      console.log(`     sectionId: ${m.sectionId || '(none)'}`);
      console.log(`     qnt: ${m.qnt} ${m.unit}`);
    });

    // Find material by _id
    // Accept materials that are global (no sectionId) OR match the requested section
    const availIndex = availableList.findIndex((m: any) => {
      try {
        // Convert both to strings for comparison
        const materialIdStr = String(m._id || '').trim();
        const requestedIdStr = String(materialId || '').trim();
        
        const sameId = materialIdStr === requestedIdStr;
        
        // Check section match - accept if material has no sectionId (global) or matches
        const materialSectionId = m.sectionId;
        const sameSection =
          !materialSectionId ||
          materialSectionId === '' ||
          String(materialSectionId) === String(sectionId);

        console.log(`\n  Checking: ${m.name}`);
        console.log(`    Material _id: "${materialIdStr}"`);
        console.log(`    Requested _id: "${requestedIdStr}"`);
        console.log(`    ID Match: ${sameId}`);
        console.log(`    Material sectionId: ${materialSectionId || '(none)'}`);
        console.log(`    Section Match: ${sameSection}`);
        console.log(`    Overall Match: ${sameId && sameSection}`);

        return sameId && sameSection;
      } catch (err) {
        console.error('Error comparing material:', err);
        return false;
      }
    });

    if (availIndex < 0) {
      console.error('\n❌ MATERIAL NOT FOUND');
      console.error('This usually means:');
      console.error('1. The materialId does not exist in MaterialAvailable');
      console.error('2. The material exists but is scoped to a different section');
      console.error('3. The _id field is missing from the materials');
      
      return NextResponse.json(
        {
          success: false,
          error: "Material not found in MaterialAvailable",
          debug: {
            requestedMaterialId: materialId,
            requestedSectionId: sectionId,
            availableMaterials: availableList.map((m: any) => ({
              _id: m._id,
              name: m.name,
              unit: m.unit,
              qnt: m.qnt,
              sectionId: m.sectionId || '(none)',
            })),
          },
        },
        { status: 404 }
      );
    }

    const available = availableList[availIndex];
    console.log('\n✅ Material found:', available.name);
    console.log('Available quantity:', available.qnt, available.unit);

    // Check sufficient quantity
    const availableQnt = Number(available.qnt || 0);
    if (availableQnt < qnt) {
      return NextResponse.json(
        {
          success: false,
          error: `Insufficient quantity available. Available: ${availableQnt}, Requested: ${qnt}`,
        },
        { status: 400 }
      );
    }

    // Prepare used material clone
    const usedClone: MaterialSubdoc = {
      name: available.name,
      unit: available.unit,
      specs: available.specs || {},
      qnt: qnt,
      cost: available.cost || 0,
      sectionId: String(sectionId),
      miniSectionId: miniSectionId || available.miniSectionId || undefined,
    };

    console.log('Creating used material entry:', usedClone);

    // Update the project document
    // Reduce quantity in MaterialAvailable
    project.MaterialAvailable[availIndex].qnt = availableQnt - qnt;

    // Add to MaterialUsed
    if (!project.MaterialUsed) {
      project.MaterialUsed = [];
    }
    project.MaterialUsed.push(usedClone as any);

    // Update spent
    const costPerUnit = Number(available.cost || 0);
    const totalCost = costPerUnit * qnt;
    project.spent = (project.spent || 0) + totalCost;

    // Remove materials with 0 or negative quantity
    project.MaterialAvailable = project.MaterialAvailable.filter(
      (m: any) => Number(m.qnt || 0) > 0
    );

    // Save the project
    const saved = await project.save();

    console.log('✅ Project updated successfully');
    console.log('New spent amount:', saved.spent);
    console.log('========================================\n');

    return NextResponse.json(
      {
        success: true,
        message: `Successfully added ${qnt} ${available.unit} of ${available.name} to used materials`,
        data: {
          projectId: saved._id,
          sectionId: sectionId,
          miniSectionId: miniSectionId,
          materialAvailable: saved.MaterialAvailable,
          materialUsed: saved.MaterialUsed,
          usedMaterial: usedClone,
          spent: saved.spent,
        },
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("Error in add-material-usage:", msg);
    return NextResponse.json(
      {
        success: false,
        error: msg,
      },
      { status: 500 }
    );
  }
};
