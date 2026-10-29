import * as Print from 'expo-print';
import { File, Paths } from 'expo-file-system';

// expo-print renders through an off-screen WebView on Android. If that render
// never reports back, the promise never settles and the report button spins
// forever, so give up after a minute with an error the user can act on.
const PRINT_TIMEOUT_MS = 60_000;

export const printToFileWithTimeout = (options: Print.FilePrintOptions): Promise<Print.FilePrintResult> =>
  new Promise((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error('Creating the PDF took too long. Please try again.')),
      PRINT_TIMEOUT_MS,
    );
    Print.printToFileAsync(options).then(
      (result) => { clearTimeout(timer); resolve(result); },
      (error) => { clearTimeout(timer); reject(error); },
    );
  });

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
  const { base64 } = await printToFileWithTimeout({ ...options, html, base64: true });
  if (!base64) throw new Error('PDF data missing');

  const file = new File(Paths.document, filename);
  if (file.exists) file.delete();
  file.create();
  // writeSync, not write(): since SDK 58 write() is async, and on Android it
  // could leave the report stuck. writeSync finishes before we hand out the URI.
  file.writeSync(base64, { encoding: 'base64' });
  return file.uri;
};
