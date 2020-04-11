import { Exec } from 'suf-node';
import * as chokidar from 'chokidar';

(async () => {
  await Exec('cd ./client && yarn watch && cd ..');

  const watcher = chokidar.watch('./server/src', { persistent: true });

  watcher.on('all', (e) => console.log(e));
  const a = 'concurrently "cd ./client && yarn watch" "cd ./server && yarn watch"';
})();
