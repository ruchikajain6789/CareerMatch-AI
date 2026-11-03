import mammoth from 'mammoth'
import * as pdfjs from 'pdfjs-dist'
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url'

pdfjs.GlobalWorkerOptions.workerSrc = pdfWorkerUrl

async function extractPdfText(file: File): Promise<string> {
  const loadingTask = pdfjs.getDocument({
    data: new Uint8Array(await file.arrayBuffer()),
  })

  try {
    const document = await loadingTask.promise
    const pages: string[] = []
    for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber += 1) {
      const page = await document.getPage(pageNumber)
      const content = await page.getTextContent()
      pages.push(
        content.items
          .map((item) => ('str' in item ? item.str : ''))
          .filter(Boolean)
          .join(' '),
      )
    }
    return pages.join('\n').trim()
  } finally {
    await loadingTask.destroy()
  }
}

export async function extractResumeText(file: File): Promise<string> {
  const extension = file.name.toLowerCase().split('.').pop()

  if (extension === 'pdf') return extractPdfText(file)
  if (extension === 'docx') {
    const result = await mammoth.extractRawText({
      arrayBuffer: await file.arrayBuffer(),
    })
    return result.value.trim()
  }

  throw new Error('Choose a PDF or DOCX resume file.')
}
