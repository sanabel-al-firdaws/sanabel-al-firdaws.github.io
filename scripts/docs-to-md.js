
import { chdir} from 'process';
import { fetchGoogleDocsFiles } from "docs-markdown-fork";

const arabic = [
   '1wkEV-zx0AhKC0znVgpgygHF5i4KcJRY64obmrG4JpGI:intro.md',
   '1YOtsFhx9RjBK-xgyeSlGaEp3QlcGKDizV5eyIm6d2PQ:ajoromia.md',
 ];
 const aqida = [
   '1YOtsFhx9RjBK-xgyeSlGaEp3QlcGKDizV5eyIm6d2PQ:aqida.md',
 ];

main()
async function main() {
     chdir('src/content/docs/arabic');
     for (const file of arabic) {
      await fetchGoogleDocsFiles([file]);
     }
     chdir('../aqida');
     for (const file of aqida) {
      await fetchGoogleDocsFiles([file]);
     }
}





   
   
