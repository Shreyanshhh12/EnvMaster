const express = require('express');
const path = require('path');
const fs = require('fs');
const envParser = require('./utils/envParser');

const app = express();
const PORT = 3000;

app.use(express.urlencoded({ extended: true }));
app.set('view engine', 'ejs');
app.use(express.static('public'));

const envFolder = path.join(__dirname, 'envs');

function listEnvFiles() {
  if (!fs.existsSync(envFolder)) return [];
  return fs.readdirSync(envFolder).filter(file => file.endsWith('.env'));
}

app.get('/', (req, res) => {
  const selectedProject = req.query.project || 'project1.env';
  const availableProjects = listEnvFiles();

  if (!availableProjects.includes(selectedProject)) {
    return res.status(404).send('Project not found');
  }

  const projectPath = path.join(envFolder, selectedProject);
  const envData = envParser.readEnv(projectPath);

  res.render('index', {
    envVars: envData,
    projects: availableProjects,
    selectedProject,
  });
});

app.post('/save', (req, res) => {
  const { keys, values, project } = req.body;
  const selectedProject = project || 'project1.env';
  const projectPath = path.join(envFolder, selectedProject);

  // Escape special chars like = and newlines
  const escape = str => str.replace(/\n/g, '\\n').replace(/=/g, '\\=');

  const envEntries = Array.isArray(keys)
    ? keys
        .map((key, i) => {
          const k = key.trim();
          const v = values[i].trim();
          return k && v ? `${escape(k)}=${escape(v)}` : null;
        })
        .filter(Boolean)
    : keys.trim() && values.trim()
    ? [`${escape(keys)}=${escape(values)}`]
    : [];

  const content = envEntries.join('\n');

  fs.writeFileSync(projectPath, content, 'utf-8');

  res.redirect('/?project=' + encodeURIComponent(selectedProject));
});

app.listen(PORT, () => {
  console.log(`✅ EnvMaster running at http://localhost:${PORT}`);
});
