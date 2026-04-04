// src/app/portal/feature/servicos/pdf/generate-pdf.ts

import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'

export interface PDFSection {
  label: string
  value: string
  type?: 'header' | 'row' | 'total' | 'deduction'
}

export interface GeneratePDFParams {
  title: string
  subtitle?: string
  sections: PDFSection[]
  disclaimer: string
  date: Date
}

export async function generateServicePDF(params: GeneratePDFParams): Promise<Uint8Array> {
  const { title, subtitle, sections, disclaimer, date } = params

  const doc = await PDFDocument.create()
  const page = doc.addPage([595.28, 841.89]) // A4
  const font = await doc.embedFont(StandardFonts.Helvetica)
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold)
  const { width, height } = page.getSize()

  let y = height - 50
  const margin = 50
  const contentWidth = width - margin * 2

  // Header: "ZATTAR ADVOGADOS"
  page.drawText('ZATTAR ADVOGADOS', {
    x: margin, y, size: 10, font: fontBold, color: rgb(0.5, 0.3, 0.8),
  })
  y -= 30

  // Title
  page.drawText(title, {
    x: margin, y, size: 18, font: fontBold, color: rgb(0.06, 0.09, 0.16),
  })
  y -= 20

  // Subtitle (optional)
  if (subtitle) {
    page.drawText(subtitle, {
      x: margin, y, size: 10, font, color: rgb(0.4, 0.4, 0.4),
    })
    y -= 15
  }

  // Date
  page.drawText(`Data: ${date.toLocaleDateString('pt-BR')}`, {
    x: margin, y, size: 9, font, color: rgb(0.5, 0.5, 0.5),
  })
  y -= 25

  // Separator line
  page.drawLine({
    start: { x: margin, y },
    end: { x: width - margin, y },
    thickness: 1, color: rgb(0.9, 0.9, 0.9),
  })
  y -= 20

  // Sections
  for (const section of sections) {
    if (y < 80) {
      // Would need new page - for now just stop (most calcs fit 1 page)
      break
    }

    const isTotal = section.type === 'total'
    const isDeduction = section.type === 'deduction'
    const isHeader = section.type === 'header'

    if (isHeader) {
      y -= 10
      page.drawText(section.label, {
        x: margin, y, size: 11, font: fontBold, color: rgb(0.5, 0.3, 0.8),
      })
      y -= 18
      continue
    }

    const selectedFont = isTotal ? fontBold : font
    const selectedColor = isDeduction ? rgb(0.8, 0.2, 0.2) : isTotal ? rgb(0.06, 0.09, 0.16) : rgb(0.3, 0.3, 0.3)
    const selectedSize = isTotal ? 12 : 10

    // Label on left
    page.drawText(section.label, {
      x: margin, y, size: selectedSize, font: selectedFont, color: selectedColor,
    })

    // Value on right
    const valueWidth = selectedFont.widthOfTextAtSize(section.value, selectedSize)
    page.drawText(section.value, {
      x: width - margin - valueWidth,
      y, size: selectedSize, font: selectedFont, color: selectedColor,
    })
    y -= 18
  }

  // Disclaimer section
  y -= 20
  page.drawLine({
    start: { x: margin, y },
    end: { x: width - margin, y },
    thickness: 0.5, color: rgb(0.9, 0.9, 0.9),
  })
  y -= 15

  // Word-wrap disclaimer text
  const words = disclaimer.split(' ')
  let currentLine = ''
  for (const word of words) {
    const test = currentLine ? `${currentLine} ${word}` : word
    if (font.widthOfTextAtSize(test, 8) > contentWidth) {
      if (y < 30) break
      page.drawText(currentLine, {
        x: margin, y, size: 8, font, color: rgb(0.6, 0.6, 0.6),
      })
      y -= 12
      currentLine = word
    } else {
      currentLine = test
    }
  }
  if (currentLine && y >= 30) {
    page.drawText(currentLine, {
      x: margin, y, size: 8, font, color: rgb(0.6, 0.6, 0.6),
    })
  }

  return doc.save()
}
