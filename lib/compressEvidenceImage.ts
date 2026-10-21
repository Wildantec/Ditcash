import imageCompression from 'browser-image-compression'

const MAX_EVIDENCE_SIZE_BYTES = 1.4 * 1024 * 1024

export async function compressEvidenceImage(file: File): Promise<File> {
  if (!file.type.startsWith('image/')) {
    throw new Error('El archivo seleccionado no es una imagen compatible.')
  }

  const compressed = await imageCompression(file, {
    maxSizeMB: 0.7,
    maxWidthOrHeight: 1280,
    useWebWorker: true,
    fileType: 'image/jpeg',
    initialQuality: 0.72,
    maxIteration: 10
  })

  if (compressed.size <= MAX_EVIDENCE_SIZE_BYTES) return compressed

  const compressedAgain = await imageCompression(compressed, {
    maxSizeMB: 0.5,
    maxWidthOrHeight: 1024,
    useWebWorker: true,
    fileType: 'image/jpeg',
    initialQuality: 0.55,
    maxIteration: 12
  })

  if (compressedAgain.size > MAX_EVIDENCE_SIZE_BYTES) {
    throw new Error('No se pudo reducir la imagen al tamaño permitido. Selecciona una foto JPG o PNG con menor resolución.')
  }

  return compressedAgain
}
