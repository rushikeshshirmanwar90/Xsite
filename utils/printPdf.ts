import * as Print from 'expo-print';
import { File, Paths } from 'expo-file-system';

/**
 * Renders HTML to a PDF and saves it in the app's document directory.
 *
 * expo-print writes its output into the raw cache dir, which expo-file-system and
 * expo-sharing aren't allowed to read in some environments (e.g. Expo Go), so the
 * PDF is returned as base64 and written to a location the app owns. The returned
 * URI can be passed straight to Sharing.shareAsync.
 */
export const printPdfToFile = async (
  html: string,
  filename: string,
  options: Omit<Print.FilePrintOptions, 'html' | 'base64'> = {},
): Promise<string> => {
  const { base64 } = await Print.printToFileAsync({ ...options, html, base64: true });
  if (!base64) throw new Error('PDF data missing');

  const file = new File(Paths.document, filename);
  if (file.exists) file.delete();
  file.create();
  file.write(base64, { encoding: 'base64' });
  return file.uri;
};
