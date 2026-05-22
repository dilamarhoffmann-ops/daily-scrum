import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const GITHUB_TOKEN = Deno.env.get("GITHUB_TOKEN")!;
const GITHUB_ORG = Deno.env.get("GITHUB_ORG") || "redesaoroquegroup";
const ORG_ID = "O_kgDOCmXDNg"; 

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function ghQuery(query: string, variables = {}) {
  const res = await fetch("https://api.github.com/graphql", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${GITHUB_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query, variables }),
  });
  return res.json();
}

// --- FASE 1: EXPORTAR LOCAIS PARA GITHUB ---
async function exportLocalToGithub() {
  const { data: projects } = await supabase.from("projects").select("*").neq("status", "Arquivado");
  const localProjects = (projects || []).filter(p => !p.id.startsWith("proj_github_"));

  if (localProjects.length === 0) return "Nada novo para exportar.";

  const listQuery = `query($org: String!) { organization(login: $org) { projectsV2(first: 100) { nodes { title } } } }`;
  const listRes = await ghQuery(listQuery, { org: GITHUB_ORG });
  const existingTitles = new Set((listRes.data?.organization?.projectsV2?.nodes || []).map((p: any) => p.title.toLowerCase()));

  let created = 0;
  for (const p of localProjects) {
    if (existingTitles.has(p.name.toLowerCase())) continue;

    const createMutation = `
      mutation($ownerId: ID!, $title: String!) {
        createProjectV2(input: { ownerId: $ownerId, title: $title }) {
          projectV2 { id number }
        }
      }
    `;
    const createRes = await ghQuery(createMutation, { ownerId: ORG_ID, title: p.name });
    if (createRes.errors) continue;

    const ghProject = createRes.data.createProjectV2.projectV2;
    created++;

    if (p.objective) {
      const updateMutation = `mutation($id: ID!, $desc: String!) { updateProjectV2(input: { projectId: $id, shortDescription: $desc }) { projectV2 { id } } }`;
      await ghQuery(updateMutation, { id: ghProject.id, desc: p.objective.substring(0, 500) });
    }

    const tasks = p.tasks || [];
    for (const task of tasks) {
      const addTaskMutation = `mutation($id: ID!, $t: String!) { addProjectV2DraftIssue(input: { projectId: $id, title: $t }) { projectItem { id } } }`;
      await ghQuery(addTaskMutation, { id: ghProject.id, title: task.text });
    }
  }
  return `Exportados: ${created}`;
}

// --- FASE 2: IMPORTAR GITHUB PARA LOCAL ---
async function fetchProjectDetail(projectNumber: number) {
  const query = `
    query {
      organization(login: "${GITHUB_ORG}") {
        projectV2(number: ${projectNumber}) {
          title
          shortDescription
          creator { login }
          items(first: 100) {
            nodes {
              id
              content {
                ... on Issue { title state assignees(first: 5) { nodes { login name } } }
                ... on DraftIssue { title assignees(first: 5) { nodes { login name } } }
              }
              fieldValues(first: 10) {
                nodes {
                  ... on ProjectV2ItemFieldDateValue {
                    field { ... on ProjectV2Field { name } }
                    date
                  }
                }
              }
            }
          }
        }
      }
    }
  `;
  const json = await ghQuery(query);
  if (json.errors || !json.data.organization.projectV2) return null;
  
  const projectData = json.data.organization.projectV2;
  const usersMap = new Map();
  let minStart = null;
  let maxEnd = null;

  const tasks = projectData.items.nodes.map((node: any) => {
    const content = node.content;
    if (!content) return null;
    (content.assignees?.nodes || []).forEach((u: any) => usersMap.set(u.login, u));
    (node.fieldValues?.nodes || []).forEach((fv: any) => {
      if (fv.field?.name === "Start date") if (!minStart || fv.date < minStart) minStart = fv.date;
      if (fv.field?.name === "End date") if (!maxEnd || fv.date > maxEnd) maxEnd = fv.date;
    });
    return {
      id: `gh_task_${node.id}`,
      text: content.title,
      status: content.state === 'OPEN' ? 'Em Andamento' : (content.state === 'CLOSED' ? 'Finalizado' : 'Não Iniciado'),
      assignee: (content.assignees?.nodes || []).map((u: any) => u.login).join(', ')
    };
  }).filter(Boolean);

  return {
    number: projectNumber,
    name: projectData.title,
    objective: `[GH-${projectNumber}] ${projectData.shortDescription || ''}`,
    creator: projectData.creator?.login || 'admin',
    startDate: minStart,
    deadline: maxEnd,
    tasks,
    teamData: Array.from(usersMap.values())
  };
}

async function runImport() {
  const listQuery = `query { organization(login: "${GITHUB_ORG}") { projectsV2(first: 100, query: "is:open") { nodes { number } } } }`;
  const listRes = await ghQuery(listQuery);
  const openProjectNodes = listRes.data?.organization?.projectsV2?.nodes || [];
  const openNumbers = openProjectNodes.map((p: any) => p.number);

  for (const num of openNumbers) {
    const detail = await fetchProjectDetail(num);
    if (!detail) continue;

    for (const u of detail.teamData) {
      const id = `gh_user_${u.login}`;
      const { data: ex } = await supabase.from('users').select('id').eq('id', id).single();
      if (!ex) {
        await supabase.from('users').insert([{ id, name: u.name || u.login, email: `${u.login}@github.com`, role: 'GitHub', access: 'Colaborador', password: '123', mustChangePassword: true }]);
      }
    }

    const { data: existing } = await supabase.from('projects').select('id').eq('name', detail.name).limit(1);
    const id = existing?.[0]?.id || `proj_github_${detail.number}`;

    const payload = {
      id, name: detail.name, objective: detail.objective, status: 'Ativo', priority: 'Média',
      tasks: detail.tasks, team: detail.teamData.map((u: any) => `gh_user_${u.login}`),
      ownerId: `gh_user_${detail.creator}`, startDate: detail.startDate, deadline: detail.deadline,
      managerId: 'admin_1'
    };
    await supabase.from('projects').upsert([payload]);
  }

  // Arquivamento
  const { data: dbProjects } = await supabase.from('projects').select('id, objective').neq('status', 'Arquivado');
  for (const dbP of (dbProjects || [])) {
    const match = dbP.objective?.match(/\[GH-(\d+)\]/);
    if (match && !openNumbers.includes(parseInt(match[1]))) {
      await supabase.from('projects').update({ status: 'Arquivado' }).eq('id', dbP.id);
    }
  }

  return `Sincronizados: ${openNumbers.length}`;
}

Deno.serve(async () => {
  try {
    const exp = await exportLocalToGithub();
    const imp = await runImport();
    return new Response(JSON.stringify({ ok: true, exp, imp }), { headers: { "Content-Type": "application/json" } });
  } catch (err) {
    return new Response(JSON.stringify({ ok: false, error: err.message }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
});
