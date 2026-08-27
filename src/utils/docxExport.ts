import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  BorderStyle,
} from "docx";

export interface AtsResumeData {
  name: string;
  title: string;
  contact: {
    email?: string;
    phone?: string;
    location?: string;
    linkedin?: string;
    portfolio?: string;
  };
  summary: string;
  experience: {
    id: string;
    company: string;
    position: string;
    duration: string;
    location?: string;
    bulletPoints: string[];
  }[];
  education: {
    id: string;
    degree: string;
    institution: string;
    year: string;
    location?: string;
  }[];
  skills: {
    core?: string[];
    tools?: string[];
    methodologies?: string[];
    [key: string]: string[] | undefined;
  };
  projects?: {
    id: string;
    name: string;
    description?: string;
    bulletPoints?: string[];
  }[];
  estimatedAtsScore?: number;
}

export async function exportAtsResumeToDocx(data: AtsResumeData): Promise<void> {
  const children: Paragraph[] = [];

  // Candidate Name Header (Large, Bold)
  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 100 },
      children: [
        new TextRun({
          text: data.name || "Candidate Name",
          bold: true,
          size: 32, // 16pt font
          color: "1E293B",
          font: "Arial",
        }),
      ],
    })
  );

  // Professional Title
  if (data.title) {
    children.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 120 },
        children: [
          new TextRun({
            text: data.title,
            bold: true,
            size: 24, // 12pt
            color: "475569",
            font: "Arial",
          }),
        ],
      })
    );
  }

  // Contact Info Line (Pipe Separated)
  const contactParts: string[] = [];
  if (data.contact?.phone) contactParts.push(data.contact.phone);
  if (data.contact?.email) contactParts.push(data.contact.email);
  if (data.contact?.location) contactParts.push(data.contact.location);
  if (data.contact?.linkedin) contactParts.push(data.contact.linkedin);
  if (data.contact?.portfolio) contactParts.push(data.contact.portfolio);

  if (contactParts.length > 0) {
    children.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 240 },
        children: [
          new TextRun({
            text: contactParts.join(" | "),
            size: 20, // 10pt
            color: "64748B",
            font: "Arial",
          }),
        ],
      })
    );
  }

  // Divider Helper
  const createSectionHeader = (titleText: string) => {
    return new Paragraph({
      heading: HeadingLevel.HEADING_2,
      spacing: { before: 240, after: 120 },
      border: {
        bottom: {
          color: "CBD5E1",
          space: 1,
          style: BorderStyle.SINGLE,
          size: 6,
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

  // Professional Summary
  if (data.summary) {
    children.push(createSectionHeader("Professional Summary"));
    children.push(
      new Paragraph({
        spacing: { after: 200 },
        children: [
          new TextRun({
            text: data.summary,
            size: 21, // 10.5pt
            color: "334155",
            font: "Arial",
          }),
        ],
      })
    );
  }

  // Work Experience
  if (data.experience && data.experience.length > 0) {
    children.push(createSectionHeader("Work Experience"));
    data.experience.forEach((exp) => {
      // Company & Duration Line
      children.push(
        new Paragraph({
          spacing: { before: 120, after: 40 },
          children: [
            new TextRun({
              text: exp.position,
              bold: true,
              size: 22, // 11pt
              color: "0F172A",
              font: "Arial",
            }),
            new TextRun({
              text: ` — ${exp.company}`,
              bold: true,
              size: 22,
              color: "334155",
              font: "Arial",
            }),
            new TextRun({
              text: exp.location ? ` (${exp.location})` : "",
              size: 20,
              color: "64748B",
              font: "Arial",
            }),
            new TextRun({
              text: `   [${exp.duration}]`,
              bold: true,
              size: 20,
              color: "475569",
              font: "Arial",
            }),
          ],
        })
      );

      // Bullet Points
      exp.bulletPoints?.forEach((bullet) => {
        children.push(
          new Paragraph({
            bullet: { level: 0 },
            spacing: { after: 40 },
            children: [
              new TextRun({
                text: bullet,
                size: 20, // 10pt
                color: "1E293B",
                font: "Arial",
              }),
            ],
          })
        );
      });
    });
  }

  // Skills
  if (data.skills) {
    children.push(createSectionHeader("Skills & Competencies"));
    const skillCategories = Object.entries(data.skills);
    skillCategories.forEach(([cat, skillList]) => {
      if (skillList && skillList.length > 0) {
        children.push(
          new Paragraph({
            spacing: { after: 60 },
            children: [
              new TextRun({
                text: `${cat.toUpperCase()}: `,
                bold: true,
                size: 20,
                color: "0F172A",
                font: "Arial",
              }),
              new TextRun({
                text: skillList.join(", "),
                size: 20,
                color: "334155",
                font: "Arial",
              }),
            ],
          })
        );
      }
    });
  }

  // Education
  if (data.education && data.education.length > 0) {
    children.push(createSectionHeader("Education"));
    data.education.forEach((edu) => {
      children.push(
        new Paragraph({
          spacing: { after: 60 },
          children: [
            new TextRun({
              text: edu.degree,
              bold: true,
              size: 21,
              color: "0F172A",
              font: "Arial",
            }),
            new TextRun({
              text: `, ${edu.institution}`,
              size: 21,
              color: "334155",
              font: "Arial",
            }),
            new TextRun({
              text: edu.year ? ` (${edu.year})` : "",
              size: 20,
              color: "64748B",
              font: "Arial",
            }),
          ],
        })
      );
    });
  }

  // Projects
  if (data.projects && data.projects.length > 0) {
    children.push(createSectionHeader("Projects & Key Initiatives"));
    data.projects.forEach((proj) => {
      children.push(
        new Paragraph({
          spacing: { before: 80, after: 40 },
          children: [
            new TextRun({
              text: proj.name,
              bold: true,
              size: 21,
              color: "0F172A",
              font: "Arial",
            }),
            new TextRun({
              text: proj.description ? ` — ${proj.description}` : "",
              size: 20,
              color: "475569",
              font: "Arial",
            }),
          ],
        })
      );
      proj.bulletPoints?.forEach((b) => {
        children.push(
          new Paragraph({
            bullet: { level: 0 },
            spacing: { after: 40 },
            children: [
              new TextRun({
                text: b,
                size: 20,
                color: "1E293B",
                font: "Arial",
              }),
            ],
          })
        );
      });
    });
  }

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 1440, // 1 inch = 1440 dxa
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
  const fileName = (data.name || "Candidate").replace(/[^a-zA-Z0-9]/g, "_");
  a.download = `${fileName}_ATS_Optimized_Resume.docx`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
