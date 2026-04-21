// Wrapper pour capturer toute sortie du test de sécurité
process.on('uncaughtException', (e) => {
  process.stdout.write('UNCAUGHT: ' + e.message + '\n' + e.stack + '\n');
  process.exit(1);
});
process.on('unhandledRejection', (e) => {
  process.stdout.write('UNHANDLED: ' + String(e) + '\n');
  process.exit(1);
});

// Patch process.exit pour flush d'abord
const _exit = process.exit.bind(process);
process.exit = (code) => {
  process.stdout.write('\n[process.exit called with code ' + code + ']\n', () => _exit(code));
};

process.stdout.write('=== Starting test wrapper ===\n');

try {
  require('./test-security.cjs');
  process.stdout.write('=== Module loaded ===\n');
} catch(e) {
  process.stdout.write('LOAD ERROR: ' + e.message + '\n' + e.stack + '\n');
}
