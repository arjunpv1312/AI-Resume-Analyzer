import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  BorderStyle,
  Table,
  TableRow,
  TableCell,
  WidthType,
} from "docx";

export async function exportFullReportToDocx(
  result: any,
  fileNamePrefix: string = "Career_Intelligence_Report"
): Promise<void> {
  const children: Paragraph[] = [];

  // Title Header
  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 120 },
      children: [
        new TextRun({
          text: "EXECUTIVE CAREER INTELLIGENCE & ATS REPORT",
          bold: true,
          size: 32, // 16pt
          color: "0F172A",
          font: "Arial",
        }),
      ],
    })
  );

  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 240 },
      children: [
        new TextRun({
          text: `Target Role: ${result?.careerPath?.topRole || result?.targetRole || "Executive Role"} | Date: ${new Date().toLocaleDateString()}`,
          bold: true,
          size: 20,
          color: "475569",
          font: "Arial",
        }),
      ],
    })
  );

  const createSectionHeader = (titleText: string) => {
    return new Paragraph({
      heading: HeadingLevel.HEADING_2,
      spacing: { before: 280, after: 140 },
      border: {
        bottom: {
          color: "0D9488",
          space: 2,
          style: BorderStyle.SINGLE,
          size: 12,
        },
      },
      children: [
        new TextRun({
          text: titleText.toUpperCase(),
          bold: true,
          size: 24, // 12pt
          color: "0F172A",
          font: "Arial",
        }),
      ],
    });
  };

  // 1. Executive Summary
  if (result?.executiveSummary || result?.summary) {
    children.push(createSectionHeader("1. Executive Summary & Assessment"));
    children.push(
      new Paragraph({
        spacing: { after: 200 },
        children: [
          new TextRun({
            text: result.executiveSummary || result.summary,
            size: 21,
            color: "334155",
            font: "Arial",
          }),
        ],
      })
    );
  }

  // 2. Core Match & ATS Scores
  children.push(createSectionHeader("2. Core Scores & Benchmarks"));
  children.push(
    new Paragraph({
      spacing: { after: 100 },
      children: [
        new TextRun({
          text: `• Overall Leadership Score: ${result?.overallScore || 0}%`,
          bold: true,
          size: 22,
          color: "0F172A",
          font: "Arial",
        }),
      ],
    })
  );
  children.push(
    new Paragraph({
      spacing: { after: 100 },
      children: [
        new TextRun({
          text: `• ATS Parsing Compatibility: ${result?.atsCompatibility || 0}%`,
          bold: true,
          size: 22,
          color: "0F172A",
          font: "Arial",
        }),
      ],
    })
  );
  children.push(
    new Paragraph({
      spacing: { after: 100 },
      children: [
        new TextRun({
          text: `• Skills Overlap Match: ${result?.skillsMatch || 0}%`,
          bold: true,
          size: 22,
          color: "0F172A",
          font: "Arial",
        }),
      ],
    })
  );
  children.push(
    new Paragraph({
      spacing: { after: 200 },
      children: [
        new TextRun({
          text: `• Formatting Health Score: ${result?.formattingHealthScore || result?.atsAnalysis?.formattingScore || 0}%`,
          bold: true,
          size: 22,
          color: "0F172A",
          font: "Arial",
        }),
      ],
    })
  );

  // 3. Skill Gap Analysis
  if (result?.skillGapReport && result.skillGapReport.length > 0) {
    children.push(createSectionHeader("3. Skill Gap Analysis & Missing Requirements"));
    result.skillGapReport.forEach((gap: any) => {
      children.push(
        new Paragraph({
          bullet: { level: 0 },
          spacing: { after: 60 },
          children: [
            new TextRun({
              text: `${gap.skill}: `,
              bold: true,
              size: 21,
              color: gap.importance === "Critical" ? "DC2626" : "D97706",
              font: "Arial",
            }),
            new TextRun({
              text: `Importance - ${gap.importance}`,
              size: 20,
              color: "475569",
              font: "Arial",
            }),
          ],
        })
      );
    });
  }

  // 4. Career Roadmap & Trajectory Forecast
  children.push(createSectionHeader("4. Career Trajectory & Pivots"));
  if (result?.careerPath?.topRole) {
    children.push(
      new Paragraph({
        spacing: { after: 100 },
        children: [
          new TextRun({
            text: `Primary Target Role: ${result.careerPath.topRole} (${result.careerPath.confidence}% Match)`,
            bold: true,
            size: 22,
            color: "0D9488",
            font: "Arial",
          }),
        ],
      })
    );
  }

  if (result?.careerPath?.alternatives && result.careerPath.alternatives.length > 0) {
    children.push(
      new Paragraph({
        spacing: { before: 120, after: 60 },
        children: [
          new TextRun({
            text: "Alternative Strategic Pivots:",
            bold: true,
            size: 21,
            color: "0F172A",
            font: "Arial",
          }),
        ],
      })
    );
    result.careerPath.alternatives.forEach((alt: any) => {
      children.push(
        new Paragraph({
          bullet: { level: 0 },
          spacing: { after: 40 },
          children: [
            new TextRun({
              text: `${alt.role} (${alt.match}% Match): `,
              bold: true,
              size: 20,
              color: "334155",
              font: "Arial",
            }),
            new TextRun({
              text: alt.reasoning || "Strategic career progression option",
              size: 20,
              color: "64748B",
              font: "Arial",
            }),
          ],
        })
      );
    });
  }

  // 5. Strategic Optimization Checklist
  if (result?.improvementPlan) {
    children.push(createSectionHeader("5. Strategic Optimization Checklist"));
    
    if (result.improvementPlan.resumeHeadlineUpdates?.length > 0) {
      children.push(
        new Paragraph({
          spacing: { before: 100, after: 40 },
          children: [
            new TextRun({
              text: "Title & Headline Updates:",
              bold: true,
              size: 21,
              color: "0F172A",
              font: "Arial",
            }),
          ],
        })
      );
      result.improvementPlan.resumeHeadlineUpdates.forEach((up: string) => {
        children.push(
          new Paragraph({
            bullet: { level: 0 },
            spacing: { after: 40 },
            children: [
              new TextRun({ text: up, size: 20, color: "334155", font: "Arial" }),
            ],
          })
        );
      });
    }

    if (result.improvementPlan.formattingFixes?.length > 0) {
      children.push(
        new Paragraph({
          spacing: { before: 100, after: 40 },
          children: [
            new TextRun({
              text: "Formatting & Parsing Fixes:",
              bold: true,
              size: 21,
              color: "0F172A",
              font: "Arial",
            }),
          ],
        })
      );
      result.improvementPlan.formattingFixes.forEach((fix: string) => {
        children.push(
          new Paragraph({
            bullet: { level: 0 },
            spacing: { after: 40 },
            children: [
              new TextRun({ text: fix, size: 20, color: "334155", font: "Arial" }),
            ],
          })
        );
      });
    }
  }

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 1440,
              right: 1440,
              bottom: 1440,
              left: 1440,
            },
          },
        },
        children,
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  const cleanName = fileNamePrefix.replace(/[^a-zA-Z0-9]/g, "_");
  a.download = `${cleanName}_Analysis_Report.docx`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
