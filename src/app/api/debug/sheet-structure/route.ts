import { NextRequest, NextResponse } from 'next/server';
import { getDoc } from '@/lib/googleSheets';

export async function GET() {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Not Found' }, { status: 404 })
  }

  try {
    const doc = await getDoc();
    await doc.loadInfo();
    
    const paymentsSheet = doc.sheetsByTitle['Payments'];
    if (paymentsSheet) {
      const rows = await paymentsSheet.getRows();
      
      if (rows.length > 0) {
        // Get column headers from the first row
        const firstRow = rows[0];
        const columns = Object.keys(firstRow.toObject());
        
        // Get sample data from a few rows
        const sampleData = rows.slice(0, 3).map((row: any) => {
          const rowData = row.toObject();
          // Only show non-empty fields for cleaner output
          const cleanData: Record<string, any> = {};
          for (const [key, value] of Object.entries(rowData)) {
            if (value !== null && value !== undefined && value !== '') {
              cleanData[key] = value;
            }
          }
          return cleanData;
        });
        
        return NextResponse.json({
          success: true,
          data: {
            sheetTitle: doc.title,
            paymentsSheetExists: true,
            totalRows: rows.length,
            columns: columns,
            sampleData: sampleData
          }
        });
      } else {
        return NextResponse.json({
          success: true,
          data: {
            sheetTitle: doc.title,
            paymentsSheetExists: true,
            totalRows: 0,
            columns: [],
            message: 'No data in Payments sheet'
          }
        });
      }
    } else {
      return NextResponse.json({
        success: false,
        error: 'Payments sheet not found',
        availableSheets: Object.keys(doc.sheetsByTitle)
      });
    }
  } catch (error) {
    console.error('Sheet structure debug error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    });
  }
}
