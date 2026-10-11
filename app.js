(() => {
  'use strict';
  const $ = (s, root = document) => root.querySelector(s);
  const $$ = (s, root = document) => [...root.querySelectorAll(s)];
  const STORE = 'nexora-vizag-bees-v1';
  const palette = ['', 'peach', 'lav', 'yellow', 'blue'];
  const starterMembers = [
    {id:'bhargavi',name:'Bhargavi',email:'bhargavi@vizagbees.com',role:'Admin'},
    {id:'jithya',name:'Jithya',email:'jithya@vizagbees.com',role:'Project lead'},
    {id:'deepika',name:'Deepika',email:'deepika@vizagbees.com',role:'Member'},
    {id:'swaroopa',name:'Swaroopa',email:'swaroopa@vizagbees.com',role:'Member'},
    {id:'roshini',name:'Roshini',email:'roshini@vizagbees.com',role:'Member'}
  ];
  const dateOffset = n => { const d=new Date(); d.setDate(d.getDate()+n); return d.toISOString().slice(0,10); };
  const starterProjects = [
    {id:'p1',name:'Vizag Coast Cleanup',description:'Bringing the neighborhood together for a cleaner coastline.',status:'In progress',deadline:dateOffset(4),lead:'Bhargavi',progress:68},
    {id:'p2',name:'Bee Friendly Gardens',description:'Creating greener spaces where pollinators can thrive.',status:'Planning',deadline:dateOffset(12),lead:'Jithya',progress:24},
    {id:'p3',name:'Community Stories',description:'Sharing the people and ideas that make Vizag special.',status:'In progress',deadline:dateOffset(1),lead:'Deepika',progress:82},
    {id:'p4',name:'Weekend Workshop',description:'A hands-on afternoon of making, learning and meeting.',status:'Completed',deadline:dateOffset(-5),lead:'Swaroopa',progress:100}
  ];
  let data = readStore();
  let toastTimer;

  function readStore() {
    try {
      const value = JSON.parse(localStorage.getItem(STORE));
      if (value && Array.isArray(value.members) && Array.isArray(value.projects)) return value;
    } catch {}
    return {members:starterMembers,projects:starterProjects,dismissedAlert:''};
  }
  function save() {
    try {
      localStorage.setItem(STORE, JSON.stringify(data));
      const saved = JSON.parse(localStorage.getItem(STORE) || 'null');
      if (!saved || saved.projects.length !== data.projects.length || saved.members.length !== data.members.length) throw new Error('Saved data could not be verified.');
      return true;
    } catch (error) {
      console.error('Could not save the Vizag Bees workspace:', error);
      toast('Could not save. Check browser storage and try again.');
      return false;
    }
  }
  const initials = name => name.trim().split(/\s+/).map(x=>x[0]).slice(0,2).join('').toUpperCase();
  const safe = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const memberByName = name => data.members.find(m => m.name === name);
  const fmtDate = value => value ? new Date(value+'T12:00:00').toLocaleDateString(undefined,{month:'short',day:'numeric'}) : 'No deadline';
  const daysAway = value => Math.ceil((new Date(value+'T23:59:59') - new Date()) / 86400000);
  function colorClass(name) {
    const i = data.members.findIndex(m => m.name === name);
    return palette[(Math.max(0,i)+1) % palette.length];
  }

  function draw() {
    renderProjects(); renderTeam(); renderStats(); renderAlerts();
    $('#sideProjectCount').textContent = data.projects.length;
    const now = new Date();
    $('#dateLabel').textContent = now.toLocaleDateString(undefined,{weekday:'long',month:'long',day:'numeric'}).toUpperCase();
  }
  function projectCard(p) {
    const done = p.status === 'Completed', lead = memberByName(p.lead);
    const days = p.deadline ? daysAway(p.deadline) : null, late = days !== null && days < 0 && !done;
    const icon = ['✳','◈','✦','❋'][Math.abs([...p.id].reduce((a,c)=>a+c.charCodeAt(0),0)) % 4];
    const progress = done ? 100 : Number(p.progress) || 0;
    return `<article class="project-card"><div class="project-card-top"><div class="project-icon ${colorClass(p.lead)}">${icon}</div><div style="display:flex;align-items:center;gap:8px"><span class="status ${p.status==='Planning'?'planning':done?'completed':''}">${safe(p.status)}</span><button class="project-menu" title="Project actions" data-edit-project="${safe(p.id)}">···</button></div></div><h3>${safe(p.name)}</h3><p>${safe(p.description||'No description yet.')}</p><div class="project-progress"><div class="progress-label"><span>Progress</span><span>${progress}%</span></div><div class="progress-track"><span style="width:${progress}%"></span></div></div><div class="project-bottom"><span class="project-lead"><span class="avatar ${colorClass(p.lead)}">${lead?safe(initials(lead.name)):'?'}</span>${safe(p.lead||'Unassigned')}</span><span class="due-date ${late?'overdue':''}">${late?'Overdue · ':''}${safe(fmtDate(p.deadline))}</span></div></article>`;
  }
  function renderProjects() {
    const query = ($('#projectSearch')?.value || '').trim().toLowerCase();
    const status = $('#statusFilter')?.value || 'all';
    const member = $('#memberFilter')?.value || 'all';
    const sort = $('#sortProjects')?.value || 'deadline';
    let projects = [...data.projects];
    if (query) projects = projects.filter(p => (p.name+' '+p.description+' '+p.lead).toLowerCase().includes(query));
    if (status !== 'all') projects = projects.filter(p => p.status === status);
    if (member !== 'all') projects = projects.filter(p => p.lead === member);
    projects.sort((a,b) => sort === 'name' ? a.name.localeCompare(b.name) : sort === 'status' ? a.status.localeCompare(b.status) : (a.deadline||'9999').localeCompare(b.deadline||'9999'));
    const html = projects.length ? projects.map(projectCard).join() : `<div class="empty-state"><b>No projects match that view.</b>Try another filter or add a new project.<br><button class="button secondary" data-create-project>＋ New project</button></div>`;
    $('#projectCards').innerHTML = data.projects.length ? data.projects.slice().sort((a,b)=>(a.deadline||'9999').localeCompare(b.deadline||'9999')).slice(0,3).map(projectCard).join() : `<div class="empty-state"><b>Your next great idea starts here.</b>Create a project and bring the team in.<br><button class="button secondary" data-create-project>＋ New project</button></div>`;
    $('#allProjectCards').innerHTML = html;
    $('#projectHeadingCount').textContent = data.projects.length;
    const select = $('#memberFilter'), old = select.value;
    select.innerHTML = '<option value="all">All members</option>' + data.members.map(m=>`<option value="${safe(m.name)}">${safe(m.name)}</option>`).join('');
    if ([...select.options].some(o=>o.value===old)) select.value = old;
  }
  function memberCard(m, large=false) {
    const roleOptions = ['Admin','Project lead','Member','Viewer'].map(r=>`<option ${m.role===r?'selected':''}>${r}</option>`).join('');
    return `<article class="team-card"><div class="avatar ${colorClass(m.name)}">${safe(initials(m.name))}</div><div class="team-meta"><b>${safe(m.name)}</b><small>${safe(m.role)} · ${safe(m.email)}</small></div>${large?`<select aria-label="Role for ${safe(m.name)}" data-role-member="${safe(m.id)}" style="width:auto;max-width:116px;margin:0;padding:7px;font-size:10px">${roleOptions}</select>`:''}</article>`;
  }
  function renderTeam() {
    const known = ['Bhargavi','Jithya','Deepika','Swaroopa','Roshini'];
    const sorted = [...data.members].sort((a,b)=>{const ia=known.indexOf(a.name),ib=known.indexOf(b.name);return (ia<0?99:ia)-(ib<0?99:ib)||a.name.localeCompare(b.name);});
    $('#sidebarMembers').innerHTML = sorted.slice(0,5).map(m=>`<div class="side-member"><span class="avatar ${colorClass(m.name)}">${safe(initials(m.name))}</span>${safe(m.name)}</div>`).join('');
    $('#teamCards').innerHTML = sorted.slice(0,5).map(m=>memberCard(m)).join('');
    $('#allTeamCards').innerHTML = sorted.map(m=>memberCard(m,true)).join('');
    $('#statMembers').textContent = data.members.length;
  }
  function renderStats() {
    const active = data.projects.filter(p=>p.status==='In progress').length;
    const done = data.projects.filter(p=>p.status==='Completed').length;
    $('#statActive').textContent = active; $('#statDone').textContent = done;
    const upcoming = data.projects.filter(p=>p.deadline&&p.status!=='Completed'&&daysAway(p.deadline)>=0).sort((a,b)=>a.deadline.localeCompare(b.deadline))[0];
    $('#statDue').textContent = upcoming ? fmtDate(upcoming.deadline) : '—';
    $('#statDueText').textContent = upcoming ? upcoming.name : 'No upcoming deadlines';
  }
  function dueSoon() {
    return data.projects.filter(p=>p.deadline&&p.status!=='Completed'&&daysAway(p.deadline)<=3).sort((a,b)=>a.deadline.localeCompare(b.deadline));
  }
  function renderAlerts() {
    const due = dueSoon(), key = due.map(p=>p.id+':'+p.deadline).join('|');
    $('#alertCount').hidden = !due.length;
    $('#alertBanner').hidden = !due.length || data.dismissedAlert === key;
    if (due.length) {
      $('#alertHeading').textContent = due.some(p=>daysAway(p.deadline)<0) ? 'A deadline needs attention' : 'Deadlines coming up';
      $('#alertText').textContent = due.map(p=>`${p.name} · ${daysAway(p.deadline)<0?'overdue':daysAway(p.deadline)===0?'today':`in ${daysAway(p.deadline)} day${daysAway(p.deadline)===1?'':'s'}`}`).join('  ·  ');
    }
  }
  $('#dismissAlert').addEventListener('click', () => {
    const due = dueSoon();
    data.dismissedAlert = due.map(p=>p.id+':'+p.deadline).join('|');
    save(); renderAlerts();
  });
  $('#alertsButton').addEventListener('click', () => {
    if (dueSoon().length) { data.dismissedAlert=''; save(); renderAlerts(); }
    else toast('You’re all clear on upcoming deadlines.');
  });

  function setView(view) {
    ['overview','projects','team','settings'].forEach(v => $('#'+v+'View').hidden = v !== view);
    $$('.nav-item').forEach(b => b.classList.toggle('selected', b.dataset.view === view));
    $('#pageCrumb').textContent = view[0].toUpperCase()+view.slice(1);
    $('#pageTitle').innerHTML = view === 'overview' ? 'A little progress,<br><em>a lot of momentum.</em>' : view === 'projects' ? 'Every idea, in motion.' : view === 'team' ? 'Good people, great work.' : 'Your workspace, your way.';
    $('#pageDescription').textContent = view === 'overview' ? 'Here’s what’s moving across Vizag Bees.' : view === 'projects' ? 'Find the next step across your team projects.' : view === 'team' ? 'Meet the people making it happen at Vizag Bees.' : 'Make Nexora feel like yours.';
    $('#newProjectBtn').hidden = view === 'team' || view === 'settings';
    $('.welcome-row').hidden = view === 'team' || view === 'settings';
  }
  $$('[data-view]').forEach(b => b.addEventListener('click', () => setView(b.dataset.view)));

  const projectModal = $('#projectModal'), memberModal = $('#memberModal');
  function showModal(modal) { modal.hidden = false; }
  function closeModal(modal) { modal.hidden = true; }
  function fillLeads() {
    const sel = $('#projectLead');
    sel.innerHTML = data.members.map(m=>`<option>${safe(m.name)}</option>`).join('') || '<option>Unassigned</option>';
  }
  function createProject() {
    $('#projectForm').reset();
    $('#progressInput').value = 50; $('#progressValue').textContent = '50%';
    fillLeads(); $('#projectModalTitle').textContent = 'A new thing in motion.';
    $('#projectForm').dataset.edit = ''; showModal(projectModal);
  }
  $('#newProjectBtn').addEventListener('click', createProject);
  $$('[data-close]').forEach(b => b.addEventListener('click', () => closeModal(b.closest('.modal-backdrop'))));
  [projectModal,memberModal].forEach(m => m.addEventListener('click', e => { if (e.target === m) closeModal(m); }));

  document.addEventListener('click', e => {
    if (e.target.closest('[data-create-project]')) createProject();
    const edit = e.target.closest('[data-edit-project]');
    if (!edit) return;
    const p = data.projects.find(x => x.id === edit.dataset.editProject);
    if (!p) return;
    fillLeads();
    const f = $('#projectForm');
    f.reset();
    f.elements.name.value = p.name;
    f.elements.description.value = p.description || '';
    f.elements.status.value = p.status;
    f.elements.deadline.value = p.deadline || '';
    f.elements.lead.value = p.lead || '';
    f.elements.progress.value = p.status === 'Completed' ? 100 : Number(p.progress) || 0;
    $('#progressValue').textContent = f.elements.progress.value + '%';
    f.dataset.edit = p.id;
    $('#projectModalTitle').textContent = 'Keep the project moving.';
    showModal(projectModal);
  });
  $('#progressInput').addEventListener('input', e => $('#progressValue').textContent = e.target.value+'%');

  $('#projectForm').addEventListener('submit', e => {
    e.preventDefault();
    const f = e.currentTarget;
    if (!f.reportValidity()) return;
    const values = Object.fromEntries(new FormData(f)), id = f.dataset.edit;
    const project = {id:id||crypto.randomUUID(),name:(values.name||'').trim(),description:(values.description||'').trim(),status:values.status,deadline:values.deadline,lead:values.lead,progress:values.status==='Completed'?100:Number(values.progress)};
    if (!project.name) { toast('Enter a project name.'); return; }
    if (id) {
      const i = data.projects.findIndex(p=>p.id===id);
      if (i >= 0) data.projects[i] = {...data.projects[i],...project};
    } else data.projects.unshift(project);
    if (!save()) return;
    closeModal(projectModal); draw();
    toast(id ? 'Project updated.' : 'Project created.');
  });

  function exportProjects() {
    if (!data.projects.length) { toast('There are no projects to export yet.'); return; }
    const fields = ['name','description','status','progress','deadline','lead'];
    const quote = value => '"' + String(value ?? '').replace(/"/g,'""') + '"';
    const csv = [fields.join(','),...data.projects.map(p=>fields.map(key=>quote(p[key])).join(','))].join('\r\n');
    const url = URL.createObjectURL(new Blob(['\ufeff'+csv],{type:'text/csv;charset=utf-8'}));
    const link = document.createElement('a');
    link.href = url; link.download = 'nexora-projects.csv';
    document.body.append(link); link.click(); link.remove();
    URL.revokeObjectURL(url); toast('Project CSV exported.');
  }
  $('#exportProjects').addEventListener('click', exportProjects);

  $('#addMemberBtn').addEventListener('click', () => { $('#memberForm').reset(); showModal(memberModal); });
  $('#sideAddMember').addEventListener('click', () => $('#addMemberBtn').click());
  $('#memberForm').addEventListener('submit', e => {
    e.preventDefault();
    const f = e.currentTarget;
    if (!f.reportValidity()) return;
    const v = Object.fromEntries(new FormData(f));
    const email = (v.email||'').trim().toLowerCase(), name = (v.name||'').trim();
    if (!name || !email) { toast('Enter the member name and email.'); return; }
    if (data.members.some(m=>m.email.toLowerCase()===email)) { toast('That email is already on the team.'); return; }
    data.members.push({id:crypto.randomUUID(),name,email,role:v.role});
    if (!save()) { data.members.pop(); return; }
    closeModal(memberModal); draw(); toast(`${name} added to the team.`);
  });
  document.addEventListener('change', e => {
    const sel = e.target.closest('[data-role-member]');
    if (!sel) return;
    const member = data.members.find(m=>m.id===sel.dataset.roleMember);
    if (member) { member.role=sel.value; save(); renderTeam(); toast(`${member.name} is now ${member.role}.`); }
  });
  function setTheme(theme) {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem(STORE+'-theme', theme);
    $$('[data-theme]').forEach(button => button.classList.toggle('active',button.dataset.theme===theme));
  }
  $$('[data-theme]').forEach(button => button.addEventListener('click', () => setTheme(button.dataset.theme)));
  ['projectSearch','statusFilter','sortProjects','memberFilter'].forEach(id => $('#'+id).addEventListener(id==='projectSearch'?'input':'change',renderProjects));
  function toast(message) {
    const node = $('#toast');
    node.textContent = message; node.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => node.classList.remove('show'),2600);
  }
  const savedTheme = localStorage.getItem(STORE+'-theme');
  setTheme(savedTheme === 'dark' ? 'dark' : 'light');
  draw();
})();