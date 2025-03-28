import express from 'express';
import cors from 'cors';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = 5001;

app.use(cors());
app.use(express.json());

app.use('/pdf', express.static(__dirname));


app.get('/stream-validate', (req, res) => {
  const url = req.query.url;
  if (!url) {
    res.status(400).send('URL is required');
    return;
  }

  res.set({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
  });

  const py = spawn('python3', ['validator.py', url]);

  py.stdout.on('data', (data) => {
    const lines = data.toString().split('\n').filter(Boolean);
    lines.forEach(line => {
      console.log("[Python] ▶️", line);
      res.write(`data: ${line}\n\n`);
    });
  });
  

  py.stderr.on('data', (data) => {
    console.error(`stderr: ${data}`);
  });

  py.on('close', () => {
    res.write('event: done\ndata: {}\n\n');
    res.end();
  });
});

app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});

