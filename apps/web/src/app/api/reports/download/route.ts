import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const requestedFile = searchParams.get("file") || "Vidarbha_Water_Project_Annual_Report_2026.pdf";

  // Prevent directory traversal attacks
  const safeFilename = path.basename(requestedFile);
  const filePath = path.join(process.cwd(), "public", safeFilename);

  if (!fs.existsSync(filePath)) {
    return NextResponse.json(
      { error: `File not found: ${safeFilename}` },
      { status: 404 }
    );
  }

  const fileBuffer = fs.readFileSync(filePath);

  return new NextResponse(fileBuffer, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${safeFilename}"`,
      "Content-Length": fileBuffer.length.toString(),
      "Cache-Control": "public, max-age=3600",
    },
  });
}
