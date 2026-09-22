import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import * as XLSX from 'xlsx';
import {
  Building2, CalendarDays, ChevronRight, CheckCircle2, Clock3, FileSpreadsheet, Globe2, Network,
  Upload, Users, AlertTriangle, Sparkles, Search, Download, FlaskConical, GitBranch, Lightbulb,
  RefreshCw, Plus, Minus, Trash2, LayoutDashboard, X, ListTree, ListChecks, Milestone, PauseCircle,
  Link2, Layers, GitFork, ZoomIn, ZoomOut, Maximize2,
} from 'lucide-react';
import './styles.css';
import {
  FIELDS, MODULES, ALL_COUNTRIES, BP_DEFAULTS, TX, TEST_TYPES, TEST_PHASES, PROCESS_MODULE,
  pct, norm, inCountryScope, analyzeMasterData, sampleMasterData, buildRoadmap, validateDependencies,
  analyzeBusinessProcesses, splitOrgRoots, buildOrgChartLayout, diagnoseUnplacedOrgs, trunc,
  ORG_NODE_W, ORG_NODE_H,
} from './data.js';

// ---------------------------------------------------------------------------
// Small reusable pieces
// ---------------------------------------------------------------------------

function CountryMultiSelect({ countries, onChange, options }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const filtered = options.filter((c) => norm(c).includes(norm(search)) && !countries.includes(c));
  const toggleOpen = () => setOpen((o) => !o);
  const add = (c) => { onChange([...countries, c]); setSearch(''); };
  const remove = (c) => onChange(countries.filter((x) => x !== c));
  return (
    <div className="countryBox">
      <div className="chips">
        {countries.map((c) => (
          <button key={c} onClick={() => remove(c)} type="button"><Globe2 size={12} />{c} ×</button>
        ))}
        {!countries.length && <span className="hintText">No countries selected yet — search below to add scope.</span>}
      </div>
      <div className="countryActions">
        <button type="button" onClick={() => onChange([...options])}>Select All</button>
        <button type="button" onClick={() => onChange([])}>Clear All</button>
      </div>
      <div className="ddWrap">
        <div className="ddSearch" onClick={toggleOpen}>
          <Search size={13} />
          <input
            placeholder="Search and add a country…"
            value={search}
            onFocus={() => setOpen(true)}
            onChange={(e) => { setSearch(e.target.value); setOpen(true); }}
          />
        </div>
        {open && (
          <div className="ddList">
            {filtered.length
              ? filtered.slice(0, 40).map((c) => (
                <div className="ddItem" key={c} onClick={() => add(c)}>
                  <Plus size={12} /> {c}
                </div>
              ))
              : <div className="ddEmpty">No matching countries, or all matches already selected.</div>}
            <div className="ddClose" onClick={() => setOpen(false)}>Close</div>
          </div>
        )}
      </div>
    </div>
  );
}

function OrgNode({ name, children, stats, depth, onSelect, selected, overrides }) {
  const [open, setOpen] = useState(true);
  const kids = children[name] || [];
  const item = stats.orgRows.find((x) => x.name === name);
  const manager = overrides[name]?.manager || item?.manager;
  return (
    <div className="orgNode" style={{ marginLeft: depth * 14 }}>
      <button type="button" className={'org ' + (selected === name ? 'sel' : '')} onClick={() => onSelect(name)}>
        <span className="orgIcon">
          {kids.length
            ? (open
              ? <Minus size={13} onClick={(e) => { e.stopPropagation(); setOpen(false); }} />
              : <Plus size={13} onClick={(e) => { e.stopPropagation(); setOpen(true); }} />)
            : <Network size={13} />}
        </span>
        <span><b>{name}</b><small>{item?.count || 0} workers · {manager || 'Manager not identified'}</small></span>
        <ChevronRight size={13} />
      </button>
      {open && kids.map((k) => (
        <OrgNode key={k} name={k} children={children} stats={stats} depth={depth + 1} onSelect={onSelect} selected={selected} overrides={overrides} />
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// App
// ---------------------------------------------------------------------------

function App() {
  const [page, setPage] = useState(1);
  const [form, setForm] = useState({
    company: 'Phoenix Corp', employees: 10000, weeks: 12,
    modules: ['HCM', 'Compensation', 'Benefits', 'Absence'],
    countries: ['India', 'United Kingdom', 'United States', 'Canada', 'Netherlands', 'Germany'],
  });

  const [dataset, setDataset] = useState(null);
  const [file, setFile] = useState('');
  const [q, setQ] = useState('');
  const [err, setErr] = useState('');

  const [org, setOrg] = useState(null);
  const [orgView, setOrgView] = useState('chart');
  const [orgOverrides, setOrgOverrides] = useState({}); // { name: { manager, parent } }
  const [editParent, setEditParent] = useState('');
  const [editManager, setEditManager] = useState('');

  const [vizScale, setVizScale] = useState(1);
  const [vizSearch, setVizSearch] = useState('');
  const svgWrapRef = useRef(null);
  const svgRef = useRef(null);

  const [bpRows, setBpRows] = useState(BP_DEFAULTS);
  const [bpFile, setBpFile] = useState('');
  const [bpView, setBpView] = useState('compare');

  const [tasks, setTasks] = useState(() => buildRoadmap(12));

  const [scenario, setScenario] = useState({ country: '', employees: 10000, module: '', process: '' });
  const [tests, setTests] = useState([]);
  const [testTypes, setTestTypes] = useState(['E2E']);
  const [testPhase, setTestPhase] = useState('SIT');
  const [testCountries, setTestCountries] = useState([]);

  // --- master data analysis, scoped to selected countries ------------------
  const stats = useMemo(() => {
    if (!dataset) return null;
    const m = dataset.map;
    const allRows = dataset.rows;
    const rows = allRows.filter((r) => inCountryScope(r[m.country], form.countries));
    const outOfScope = allRows.filter((r) => !inCountryScope(r[m.country], form.countries));
    const mapped = new Set(Object.values(m).filter(Boolean));
    const uniq = (k) => new Set(rows.map((x) => String(x[m[k]] ?? '').trim()).filter(Boolean)).size;
    const miss = {};
    rows.forEach((x) => x.__missing.forEach((v) => { miss[v] = (miss[v] || 0) + 1; }));
    const orgs = [...new Set(rows.map((x) => String(x[m.supOrg] ?? '').trim()).filter(Boolean))];
    const countries = [...new Set(rows.map((x) => String(x[m.country] ?? '').trim()).filter(Boolean))];
    const orgRows = orgs.map((o) => {
      const p = rows.filter((x) => String(x[m.supOrg] ?? '').trim() === o);
      const ms = [...new Set(p.map((x) => String(x[m.manager] ?? '').trim()).filter(Boolean))];
      return { name: o, count: p.length, manager: ms[0] || 'Not identified', managers: ms, people: p };
    });
    const tx = TX.map(([label, key]) => {
      const h = dataset.headers.find((x) => !mapped.has(x) && norm(x).includes(key));
      return [label, h ? rows.filter((x) => String(x[h] ?? '').trim()).length : null];
    });
    return {
      total: rows.length, ready: rows.filter((x) => x.__ready).length, blocked: rows.filter((x) => !x.__ready).length,
      orgs, countries, miss, orgRows, tx, jobProfiles: uniq('jobProfile'), locations: uniq('location'),
      outOfScopeCount: outOfScope.length, outOfScopeCountries: [...new Set(outOfScope.map((x) => String(x[m.country] ?? '').trim()).filter(Boolean))],
      totalAll: allRows.length,
    };
  }, [dataset, form.countries]);

  // --- organization hierarchy, with consultant overrides layered on top ----
  const hierarchy = useMemo(() => {
    if (!stats) return { roots: [], children: {}, exceptions: [], parent: {}, heads: {} };
    const heads = {};
    const exceptions = [];
    stats.orgRows.forEach((o) => {
      if (o.managers.length > 1) exceptions.push(`${o.name}: multiple possible heads identified (${o.managers.join(', ')}).`);
      if (!o.managers.length) exceptions.push(`${o.name}: no manager identified for this supervisory organization.`);
      heads[o.name] = o.managers[0] || '';
    });
    const employeeByName = {};
    dataset.rows.forEach((r) => {
      const n = `${r[dataset.map.firstName] || ''} ${r[dataset.map.lastName] || ''}`.trim();
      if (n) employeeByName[n] = r;
    });
    const parent = {};
    stats.orgRows.forEach((o) => {
      const h = heads[o.name];
      if (!h) { parent[o.name] = null; return; }
      const headRec = employeeByName[h];
      if (!headRec) { parent[o.name] = null; exceptions.push(`${o.name}: manager "${h}" not found as an employee record.`); return; }
      const pm = String(headRec[dataset.map.manager] ?? '').trim();
      if (!pm) { parent[o.name] = null; return; }
      const po = stats.orgRows.find((x) => heads[x.name] === pm);
      if (po && po.name !== o.name) parent[o.name] = po.name;
      else if (po?.name === o.name) { exceptions.push(`${o.name}: circular self-reference detected in manager chain.`); parent[o.name] = null; }
      else { parent[o.name] = null; exceptions.push(`${o.name}: parent organization unresolved from manager "${pm}".`); }
    });
    // consultant overrides win over the inferred structure
    Object.entries(orgOverrides).forEach(([name, ov]) => {
      if (ov.parent !== undefined) parent[name] = ov.parent || null;
    });
    const children = {};
    stats.orgRows.forEach((o) => { children[o.name] = []; });
    Object.entries(parent).forEach(([name, p]) => { if (p && children[p]) children[p].push(name); });
    const roots = stats.orgRows.filter((o) => !parent[o.name]).map((o) => o.name);
    return { roots, children, exceptions, parent, heads };
  }, [stats, dataset, orgOverrides]);

  // --- organization visualizer: full-chart layout built on the same hierarchy,
  // separating orgs whose place in the tree is genuinely resolved from those
  // that can't be placed yet because supervisory data is missing/invalid. ----
  const orgViz = useMemo(() => {
    if (!stats) return null;
    const { resolved, orphan } = splitOrgRoots(hierarchy.roots, hierarchy.exceptions);
    const layout = buildOrgChartLayout(resolved, hierarchy.children);
    const cutByChild = {};
    layout.cycles.forEach((c) => { cutByChild[c.child] = c.parent; });
    const placedNames = layout.nodes.map((n) => n.name);
    const orphanDetails = diagnoseUnplacedOrgs(stats.orgs, placedNames, hierarchy.parent, hierarchy.exceptions, cutByChild)
      .map((d) => ({ ...d, count: stats.orgRows.find((o) => o.name === d.name)?.count || 0 }));
    return { resolved, orphan, orphanDetails, layout };
  }, [stats, hierarchy]);

  const vizNodeByName = useMemo(() => {
    const m = {};
    if (orgViz) orgViz.layout.nodes.forEach((n) => { m[n.name] = n; });
    return m;
  }, [orgViz]);

  const fitVizToScreen = () => {
    if (!svgWrapRef.current || !orgViz?.layout?.width) return;
    const cw = svgWrapRef.current.clientWidth - 24;
    const s = Math.max(0.25, Math.min(1, cw / orgViz.layout.width));
    setVizScale(+s.toFixed(2));
  };

  useEffect(() => {
    if (page === 9 && orgViz?.layout?.width) {
      const t = setTimeout(fitVizToScreen, 40);
      return () => clearTimeout(t);
    }
  }, [page, orgViz?.layout?.width]);

  const exportVizSVG = () => {
    if (!svgRef.current) return;
    const src = new XMLSerializer().serializeToString(svgRef.current);
    const withNs = /xmlns=/.test(src) ? src : src.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"');
    const blob = new Blob([withNs], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'Phoenix_Org_Chart.svg'; a.click();
    URL.revokeObjectURL(url);
  };

  const exportVizPNG = () => {
    if (!svgRef.current || !orgViz?.layout?.width) return;
    const src = new XMLSerializer().serializeToString(svgRef.current);
    const withNs = /xmlns=/.test(src) ? src : src.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"');
    const blob = new Blob([withNs], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => {
      const scale = 2;
      const canvas = document.createElement('canvas');
      canvas.width = orgViz.layout.width * scale;
      canvas.height = orgViz.layout.height * scale;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#f6f8fc';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.scale(scale, scale);
      ctx.drawImage(img, 0, 0, orgViz.layout.width, orgViz.layout.height);
      URL.revokeObjectURL(url);
      canvas.toBlob((b) => {
        const a = document.createElement('a');
        a.href = URL.createObjectURL(b);
        a.download = 'Phoenix_Org_Chart.png';
        a.click();
      });
    };
    img.onerror = () => URL.revokeObjectURL(url);
    img.src = url;
  };

  const planEnd = Math.max(...tasks.map((x) => x.e), 1);
  const weeks = Math.min(52, Math.max(4, Math.round(Number(form.weeks)) || 12));
  const validatedTasks = useMemo(() => validateDependencies(tasks), [tasks]);
  const conflictCount = validatedTasks.filter((t) => t.conflict).length;

  const setWeeks = (v) => {
    const w = Math.min(52, Math.max(4, Number(v) || 12));
    setForm({ ...form, weeks: w });
    const fresh = buildRoadmap(w);
    setTasks(fresh.map((x, i) => ({ ...x, owner: tasks[i]?.owner || x.owner, notes: tasks[i]?.notes || '' })));
  };

  const upload = async (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    try {
      const b = await f.arrayBuffer();
      const wb = XLSX.read(b, { type: 'array', cellDates: true });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows = ws ? XLSX.utils.sheet_to_json(ws, { defval: '' }) : [];
      if (!rows.length) throw new Error('No data rows found');
      setDataset(analyzeMasterData(rows));
      setFile(f.name); setErr(''); setPage(3);
    } catch (x) {
      setErr('Could not read the file. Please upload a valid Excel or CSV file.'); setPage(3);
    }
    e.target.value = '';
  };
  const loadSample = () => { setDataset(analyzeMasterData(sampleMasterData())); setFile('Phoenix_Master_Data_Demo.xlsx (sample data)'); setPage(3); };

  const filtered = useMemo(() => {
    if (!dataset || !stats) return [];
    const scoped = dataset.rows.filter((r) => inCountryScope(r[dataset.map.country], form.countries));
    return (q ? scoped.filter((r) => Object.entries(r).some(([k, v]) => !k.startsWith('__') && norm(v).includes(norm(q)))) : scoped).slice(0, 30);
  }, [dataset, q, form.countries, stats]);

  const exportOrgs = () => {
    if (!stats) return;
    const rows = stats.orgRows.flatMap((o) => o.people.map((p) => ({
      'Supervisory Organization': o.name,
      'Proposed Manager': orgOverrides[o.name]?.manager || o.manager,
      'Parent Organization': hierarchy.parent[o.name] || '',
      'Employee ID': p[dataset.map.employeeId] ?? '',
      'First Name': p[dataset.map.firstName] ?? '',
      'Last Name': p[dataset.map.lastName] ?? '',
      'Job Profile': p[dataset.map.jobProfile] ?? '',
      Country: p[dataset.map.country] ?? '',
    })));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), 'Supervisory Orgs');
    XLSX.writeFile(wb, 'Phoenix_Proposed_Supervisory_Orgs.xlsx');
  };

  const parseBP = async (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    try {
      const b = await f.arrayBuffer();
      const wb = XLSX.read(b, { type: 'array' });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const raw = XLSX.utils.sheet_to_json(ws, { defval: '' });
      const keys = Object.keys(raw[0] || {});
      const find = (aliases) => keys.find((k) => aliases.includes(norm(k)));
      const pm = find(['business process', 'process', 'business_process']);
      const cm = find(['country', 'country name']);
      const sm = find(['step number', 'step', 'step no', 'step_number']);
      const nm = find(['step name', 'step_name', 'activity', 'step description']);
      const rm = find(['role approver', 'role / approver', 'role', 'approver']);
      const cl = find(['step classification', 'classification', 'type']);
      const parsed = raw.map((r, i) => ({
        process: String(r[pm] || 'Unknown Process'), country: String(r[cm] || 'Global'),
        step: Number(r[sm]) || i + 1, name: String(r[nm] || `Step ${i + 1}`),
        role: String(r[rm] || ''), classification: String(r[cl] || ''),
      }));
      setBpRows(parsed); setBpFile(f.name);
    } catch (x) { alert('Could not parse the business-process file.'); }
    e.target.value = '';
  };

  const bpScoped = useMemo(
    () => bpRows.filter((r) => r.country === 'Global' || inCountryScope(r.country, form.countries)),
    [bpRows, form.countries],
  );
  const bpOutOfScopeCountries = useMemo(
    () => [...new Set(bpRows.filter((r) => r.country !== 'Global' && !inCountryScope(r.country, form.countries)).map((r) => r.country))],
    [bpRows, form.countries],
  );
  const bpAnalysis = useMemo(() => analyzeBusinessProcesses(bpScoped), [bpScoped]);

  // --- impact analyzer -------------------------------------------------------
  const impact = useMemo(() => {
    const countryAdded = !!scenario.country && !inCountryScope(scenario.country, form.countries);
    const moduleAdded = !!scenario.module && !form.modules.includes(scenario.module);
    const empBefore = Number(form.employees) || 0;
    const empAfter = scenario.employees === '' ? empBefore : Number(scenario.employees);
    const empDelta = empAfter - empBefore;
    const processChanged = scenario.process || '';

    const impacts = [];
    const roadmapActivities = new Set();
    const testAreas = new Set();
    const dataAreas = new Set();

    if (countryAdded) {
      impacts.push(['Country scope', `Adding ${scenario.country} introduces country-specific configuration, business-process variants and localization that are not yet designed.`]);
      ['Design & Configuration', 'Design & Config — BP + Security', 'Data Profiling & Cleansing', 'E2E & Integration Testing', 'UAT & Readiness'].forEach((a) => roadmapActivities.add(a));
      testAreas.add(`New ${scenario.country}-specific scenarios across in-scope business processes`);
      dataAreas.add(`Master data profiling and cleansing for the ${scenario.country} employee population`);
    }
    if (moduleAdded) {
      impacts.push(['Module scope', `Adding ${scenario.module} requires new configuration, security and downstream testing for that module.`]);
      ['Design & Configuration', 'E2E & Integration Testing', 'UAT & Readiness'].forEach((a) => roadmapActivities.add(a));
      testAreas.add(`${scenario.module} unit, SIT and E2E coverage`);
      dataAreas.add(`${scenario.module}-specific configuration objects and related master/derived data`);
    }
    if (empDelta > 0) {
      impacts.push(['Population growth', `An increase of ${empDelta.toLocaleString()} workers increases data-migration volume and validation/rehearsal effort.`]);
      ['Data Profiling & Cleansing', 'Data Migration — Mock Load 1', 'Data Migration — Mock Load 2', 'Cutover Rehearsal & Readiness'].forEach((a) => roadmapActivities.add(a));
      dataAreas.add('Data migration volume and reconciliation effort');
    } else if (empDelta < 0) {
      impacts.push(['Population reduction', `A decrease of ${Math.abs(empDelta).toLocaleString()} workers may reduce migration volume, but termination/offboarding handling should be reconfirmed.`]);
    }
    if (processChanged) {
      impacts.push(['Business process change', `Marking "${processChanged}" as changed may affect approval configuration, security and any test cases that already cover this process.`]);
      roadmapActivities.add('Design & Config — BP + Security');
      testAreas.add(`Existing test cases covering ${processChanged}`);
    }
    if (!impacts.length) {
      impacts.push(['No material scope change', 'The selected scenario matches the current country, module and population scope — no additional impact identified.']);
    }
    const existingImpactedTests = tests.filter((t) => (processChanged && t.process === processChanged) || (moduleAdded && t.module === scenario.module));
    return { countryAdded, moduleAdded, empDelta, processChanged, impacts, roadmapActivities: [...roadmapActivities], testAreas: [...testAreas], dataAreas: [...dataAreas], existingImpactedTests };
  }, [form, scenario, tests]);

  // --- AI test design ---------------------------------------------------------
  const testScopeCountries = testCountries.length ? testCountries : form.countries;
  const generateTests = () => {
    const countries = testScopeCountries.length ? testScopeCountries : [...new Set(bpScoped.map((r) => r.country))];
    const processesAvailable = [...new Set(bpScoped.map((r) => r.process))];
    const processes = processesAvailable.length ? processesAvailable : ['Hire', 'Change Job'];
    const types = testTypes.length ? testTypes : ['E2E'];
    const generated = [];
    let id = 1;
    countries.forEach((country) => {
      processes.forEach((process) => {
        const module = PROCESS_MODULE[process] || form.modules[0] || 'HCM';
        if (form.modules.length && !form.modules.includes(module)) return;
        types.forEach((type) => {
          const rows = bpRows.filter((r) => r.process === process && norm(r.country) === norm(country)).sort((a, b) => a.step - b.step);
          const steps = rows.length ? rows.map((r) => `${r.step}. ${r.name} (${r.role})`) : [`Initiate ${process}`, 'Complete configured approvals', 'Validate outcome'];
          generated.push({
            id: `TC-${String(id++).padStart(3, '0')}`, process, country, module, testType: type, testPhase,
            scenario: `Validate ${process} for ${country} (${type})`,
            preconditions: `Active worker population exists; ${country} configuration and security are active for ${module}.`,
            testData: `Sample worker in ${country} with valid Supervisory Organization, Job Profile, Location and Company.`,
            steps,
            expected: `${process} completes successfully; Supervisory Organization, manager, job, compensation, benefits and security update correctly with no unexpected downstream impact.`,
            priority: (process === 'Hire' || process === 'Termination') ? 'High' : 'Medium',
          });
        });
      });
    });
    if (stats && dataset) {
      Object.entries(hierarchy.parent || {}).filter(([, p]) => p).slice(0, 3).forEach(([child, parentOrg]) => {
        const childOrg = stats.orgRows.find((o) => o.name === child);
        const childCountry = childOrg?.people?.[0]?.[dataset.map.country] || 'Global';
        generated.push({
          id: `TC-${String(id++).padStart(3, '0')}`, process: 'Transfer', country: childCountry, module: 'HCM', testType: 'E2E', testPhase,
          scenario: `Transfer employee from ${child} to ${parentOrg}`,
          preconditions: `Employee currently active in ${child}, reporting into the ${child} manager.`,
          testData: `Existing worker record in supervisory organization ${child}.`,
          steps: [
            `Initiate Transfer from ${child} to ${parentOrg}`,
            'Confirm new Supervisory Organization and manager',
            'Revalidate Job Profile, Location and Company',
            'Revalidate Compensation and Benefits eligibility',
            'Revalidate security role assignment',
          ],
          expected: `Worker moves to ${parentOrg} with the correct manager; Job Profile, Location, Company, Compensation, Benefits and Security reflect the new organization with no orphaned assignments.`,
          priority: 'High',
        });
      });
    }
    setTests(generated);
  };

  const testsWithImpact = useMemo(() => tests.map((t) => ({
    ...t,
    impacted: (impact.moduleAdded && t.module === scenario.module) || (!!impact.processChanged && t.process === impact.processChanged),
  })), [tests, impact, scenario]);

  const selectedOrg = stats?.orgRows?.find((x) => x.name === org) || null;
  const openOrgEditor = (name) => {
    setOrg(name);
    setEditParent(hierarchy.parent[name] || '');
    setEditManager(orgOverrides[name]?.manager || stats?.orgRows.find((o) => o.name === name)?.manager || '');
  };
  const saveOrgEdit = () => {
    if (!org) return;
    setOrgOverrides({ ...orgOverrides, [org]: { parent: editParent || null, manager: editManager || null } });
  };

  const nav = [
    ['Project Setup', 1, Building2], ['AI Roadmap', 2, CalendarDays], ['Master Data', 3, FileSpreadsheet],
    ['Org Designer', 4, Network], ['Org Visualizer', 9, GitFork], ['Business Processes', 6, GitBranch],
    ['Impact Analyzer', 7, Lightbulb], ['Test Design', 8, FlaskConical], ['Readiness', 5, LayoutDashboard],
  ];

  return (
    <div className="app">
      <aside className="side">
        <div className="brand"><div className="mark">P</div><div><b>PHOENIX</b><small>Implementation Assistant</small></div></div>
        <div className="sect">IMPLEMENTATION</div>
        {nav.map(([t, n, I]) => (
          <button className={'nav ' + (page === n ? 'active' : '')} onClick={() => setPage(n)} key={t} type="button">
            <I size={16} /><span>{t}</span>{n === 3 && dataset ? <i>✓</i> : null}
          </button>
        ))}
        <div className="sideFoot"><Sparkles size={16} /><span><b>Prototype intelligence</b><small>Deterministic analysis with consultant-controlled recommendations.</small></span></div>
      </aside>
      <main className="main">
        <header>
          <div>
            <small className="crumb">PHOENIX / IMPLEMENTATION</small>
            <h1>{nav.find((x) => x[1] === page)?.[0] || 'PHOENIX'}</h1>
            <p>
              {page === 3 ? 'Analyze employee master data and readiness, scoped to the selected countries.'
                : page === 4 ? 'Infer and review the supervisory organization hierarchy.'
                : page === 9 ? 'A full, exportable org chart built from the same inferred hierarchy.'
                : page === 6 ? 'Compare global and country-specific current-state processes.'
                : page === 7 ? 'Model implementation scope changes and downstream impact.'
                : page === 8 ? 'Generate implementation-specific test scenarios.'
                : 'Turn implementation inputs into a measurable plan.'}
            </p>
          </div>
          <div className="headBtns">
            <span className="pill">● Prototype v0.5</span>
            {page === 1 && <button className="primary" onClick={() => setPage(2)} type="button">Generate roadmap <ChevronRight size={15} /></button>}
          </div>
        </header>

        {page === 1 && (
          <section className="setup">
            <div className="card">
              <h2>Project details</h2>
              <p className="muted">These parameters drive the implementation plan and downstream analysis.</p>
              <label>Company / Client</label>
              <div className="input"><Building2 size={15} /><input value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} /></div>
              <div className="two">
                <div><label>Total employees</label><div className="input"><Users size={15} /><input type="number" value={form.employees} onChange={(e) => setForm({ ...form, employees: e.target.value })} /></div></div>
                <div><label>Implementation duration</label><div className="input"><Clock3 size={15} /><input type="number" value={weeks} onChange={(e) => setWeeks(e.target.value)} /><em>weeks</em></div></div>
              </div>
              <label>Countries in scope <small className="labelHint">— source of truth for roadmap, master data, org, process, impact and test design</small></label>
              <CountryMultiSelect countries={form.countries} onChange={(countries) => setForm({ ...form, countries })} options={ALL_COUNTRIES} />
              <label>Modules in scope</label>
              <div className="mods">
                {MODULES.map((m) => (
                  <button className={form.modules.includes(m) ? 'sel' : ''} key={m} type="button"
                    onClick={() => setForm({ ...form, modules: form.modules.includes(m) ? form.modules.filter((x) => x !== m) : [...form.modules, m] })}>
                    {form.modules.includes(m) && '✓ '}{m}
                  </button>
                ))}
              </div>
            </div>
            <div className="card preview">
              <h2>Implementation profile</h2>
              <div className="hero"><div className="heroIcon"><Building2 /></div><div><b>{form.company}</b><small>{Number(form.employees).toLocaleString()} employees · {form.countries.length} countries</small></div></div>
              <div className="kpis">
                <div><small>DURATION</small><b>{weeks} wks</b></div>
                <div><small>MODULES</small><b>{form.modules.length}</b></div>
                <div><small>COUNTRIES</small><b>{form.countries.length}</b></div>
                <div><small>EMPLOYEES</small><b>{Number(form.employees).toLocaleString()}</b></div>
              </div>
              <div className="callout"><Sparkles size={15} /><span><b>Scope-driven prototype</b><small>Country and module selections flow live into the roadmap, master data analysis, organization designer, business process analysis, impact analysis and test design — nothing downstream is hard-coded.</small></span></div>
            </div>
          </section>
        )}

        {page === 2 && (() => {
          const owners = ['PM', 'HCM', 'Data', 'Testing'];
          const addTask = (type) => setTasks([...tasks, {
            id: Date.now(), name: type === 'milestone' ? 'New milestone' : type === 'buffer' ? 'Buffer / catch-up' : 'New implementation activity',
            s: Math.min(weeks, 1), e: Math.min(weeks, type === 'milestone' ? 1 : 2), l: 'Consultant added', c: 'blue',
            owner: owners[tasks.length % 4], notes: '', type, dependsOn: null,
          }]);
          return (
            <section className="page">
              <div className="summary">
                <div className="accent"><small>DURATION</small><b>{weeks} weeks</b><span>to go-live</span></div>
                <div><small>ACTIVITIES</small><b>{tasks.length}</b><span>workstream items</span></div>
                <div><small>GO-LIVE</small><b>Week {weeks}</b><span>hypercare to week {planEnd}</span></div>
                <div><small>SCOPE</small><b>{form.modules.length} modules</b><span>{form.countries.length} countries</span></div>
              </div>
              <div className="card roadmap">
                <div className="title">
                  <div><h2>{form.company || 'Implementation'} editable roadmap</h2><p>Edit start/end weeks, owners, dependencies and notes below. Milestones and buffers render distinctly on the bars.</p></div>
                  <div className="ganttAddBtns">
                    <button className="secondary" onClick={() => addTask('activity')} type="button"><Plus size={14} /> Activity</button>
                    <button className="secondary" onClick={() => addTask('milestone')} type="button"><Milestone size={14} /> Milestone</button>
                    <button className="secondary" onClick={() => addTask('buffer')} type="button"><PauseCircle size={14} /> Buffer</button>
                  </div>
                </div>
                <div className="gantt editable">
                  <div className="ghead"><div>PHASE</div><div className="weeks" style={{ '--w': planEnd }}>{Array.from({ length: planEnd }, (_, k) => <span key={k}>W{k + 1}</span>)}</div></div>
                  {validatedTasks.map((p) => (
                    <div className="grow" key={p.id}>
                      <div className="rlabel">
                        <b>{p.name}</b><small>{p.l} · {p.owner}</small>
                        {p.conflict && <small className="conflictTag"><AlertTriangle size={9} /> Dependency conflict</small>}
                        <div className="taskBtns"><button onClick={() => setTasks(tasks.filter((x) => x.id !== p.id))} type="button"><Trash2 size={10} /></button></div>
                      </div>
                      <div className="track" style={{ '--w': planEnd }}>
                        {Array.from({ length: planEnd }, (_, k) => <i key={k} />)}
                        {p.type === 'milestone'
                          ? <strong className={'milestoneMark ' + p.c} style={{ left: `${((p.s - 1) / planEnd) * 100}%` }} title={p.name} />
                          : <strong className={p.c + (p.type === 'buffer' ? ' bufferMark' : '') + (p.conflict ? ' conflictMark' : '')} style={{ left: `${((p.s - 1) / planEnd) * 100}%`, width: `${((p.e - p.s + 1) / planEnd) * 100}%` }}>
                            {p.e > p.s ? `W${p.s}–W${p.e}` : `W${p.s}`}
                          </strong>}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="editPanel">
                  <b>Edit activities</b>
                  {validatedTasks.map((p) => (
                    <div className="editRowFull" key={p.id}>
                      <input value={p.name} onChange={(e) => setTasks(tasks.map((x) => (x.id === p.id ? { ...x, name: e.target.value } : x)))} />
                      <label>Start <input type="number" min="1" max={weeks + 6} value={p.s} onChange={(e) => setTasks(tasks.map((x) => (x.id === p.id ? { ...x, s: Math.max(1, Number(e.target.value) || 1), e: Math.max(x.e, Number(e.target.value) || 1) } : x)))} /></label>
                      <label>End <input type="number" min={p.s} max={weeks + 6} value={p.e} onChange={(e) => setTasks(tasks.map((x) => (x.id === p.id ? { ...x, e: Math.max(p.s, Number(e.target.value) || p.s) } : x)))} /></label>
                      <input placeholder="Owner" value={p.owner} onChange={(e) => setTasks(tasks.map((x) => (x.id === p.id ? { ...x, owner: e.target.value } : x)))} />
                      <select value={p.dependsOn || ''} onChange={(e) => setTasks(tasks.map((x) => (x.id === p.id ? { ...x, dependsOn: e.target.value ? Number(e.target.value) : null } : x)))}>
                        <option value="">No dependency</option>
                        {tasks.filter((t) => t.id !== p.id).map((t) => <option key={t.id} value={t.id}>after: {t.name}</option>)}
                      </select>
                      <input placeholder="Notes" value={p.notes} onChange={(e) => setTasks(tasks.map((x) => (x.id === p.id ? { ...x, notes: e.target.value } : x)))} />
                    </div>
                  ))}
                </div>
                {conflictCount > 0 && (
                  <div className="gate conflict"><AlertTriangle size={13} />{conflictCount} activity{conflictCount > 1 ? 'ies' : ''} start before its dependency finishes — review the flagged rows above.</div>
                )}
                <div className="gate"><Link2 size={13} />Built-in dependency rules: UAT & Readiness follows E2E exit; Final Readiness follows UAT; Go-Live follows Final Readiness. Consultant-added dependencies are validated the same way.</div>
              </div>
            </section>
          );
        })()}

        {page === 3 && (
          <section className="page">
            {err && <div className="gate"><AlertTriangle size={13} />{err}</div>}
            {!dataset ? (
              <div className="card upload">
                <div className="uploadIcon"><Upload /></div>
                <h2>Upload final master data</h2>
                <p>Upload the AI-processed employee master list. Phoenix analyzes completeness, organizations, countries, job profiles and transaction signals — scoped to the countries selected in Project Setup.</p>
                <label className="uploadBtn"><Upload size={15} /> Choose Excel / CSV<input type="file" accept=".xlsx,.xls,.csv" onChange={upload} /></label>
                <button className="demo" onClick={loadSample} type="button">Use Phoenix demo dataset</button>
              </div>
            ) : (
              <>
                <div className="dataHead">
                  <div><h2>{file}</h2><p>{stats.totalAll.toLocaleString()} employee records uploaded · {stats.total.toLocaleString()} in selected country scope</p></div>
                  <label className="secondary">Replace file<input type="file" accept=".xlsx,.xls,.csv" onChange={upload} /></label>
                </div>
                {stats.outOfScopeCount > 0 && (
                  <div className="gate scope"><Globe2 size={13} />{stats.outOfScopeCount} record(s) belong to {stats.outOfScopeCountries.join(', ')}, which {stats.outOfScopeCountries.length > 1 ? 'are' : 'is'} not in the selected implementation scope, so {stats.outOfScopeCountries.length > 1 ? 'they are' : 'it is'} excluded from analysis below. Add {stats.outOfScopeCountries.length > 1 ? 'these countries' : 'this country'} in Project Setup to include them.</div>
                )}
                <div className="stats">
                  <div><small>IN-SCOPE EMPLOYEES</small><b>{stats.total}</b><span>records</span></div>
                  <div className="good"><small>CORE READY</small><b>{stats.ready}</b><span>{pct(stats.ready, stats.total)}% complete</span></div>
                  <div className="bad"><small>REMEDIATION</small><b>{stats.blocked}</b><span>missing required fields</span></div>
                  <div><small>SUP ORGS</small><b>{stats.orgs.length}</b><span>unique values</span></div>
                  <div><small>COUNTRIES</small><b>{stats.countries.length}</b><span>identified in scope</span></div>
                </div>
                <div className="analysisGrid">
                  <div className="card panel">
                    <div className="title"><div><h2>Master data analysis</h2><p>Completeness against prototype rules, in-scope only</p></div><CheckCircle2 className="okIcon" /></div>
                    {FIELDS.map(([k, l]) => {
                      const h = dataset.map[k];
                      const n = h ? stats.total && dataset.rows.filter((x) => inCountryScope(x[dataset.map.country], form.countries) && String(x[h] ?? '').trim()).length : 0;
                      return (
                        <div className="field" key={k}>
                          <span><b>{l}</b><small>{h ? 'Mapped: ' + h : 'Column not found'}</small></span>
                          <div><i><em style={{ width: `${pct(n, stats.total)}%` }} /></i></div>
                          <strong>{n}/{stats.total}</strong>
                        </div>
                      );
                    })}
                  </div>
                  <div className="card panel">
                    <div className="title"><div><h2>Missing data</h2><p>Highest-volume exceptions, in scope</p></div><AlertTriangle className="warn" /></div>
                    {Object.entries(stats.miss).sort((a, b) => b[1] - a[1]).map(([k, v]) => <div className="issue" key={k}><span>{k}</span><b>{v}</b></div>)}
                    {!Object.keys(stats.miss).length && <div className="noIssue">No missing-data exceptions in the selected scope.</div>}
                  </div>
                </div>
                <div className="analysisGrid">
                  <div className="card panel">
                    <div className="title"><div><h2>Transactional analysis</h2><p>Detected only when transaction columns exist</p></div></div>
                    {stats.tx.map(([l, n]) => <div className="issue" key={l}><span>{l}</span><b>{n === null ? 'Not detected' : n}</b></div>)}
                  </div>
                  <div className="card panel">
                    <div className="title"><div><h2>Implementation objects</h2><p>Identified from in-scope master data</p></div></div>
                    <div className="objectGrid">
                      <div><small>Job Profiles</small><b>{stats.jobProfiles}</b></div>
                      <div><small>Locations</small><b>{stats.locations}</b></div>
                      <div><small>Sup Orgs</small><b>{stats.orgs.length}</b></div>
                      <div><small>Countries</small><b>{stats.countries.length}</b></div>
                    </div>
                  </div>
                </div>
                <div className="card records">
                  <div className="title"><div><h2>Employee records</h2><p>Search and inspect readiness (in-scope countries only).</p></div><div className="search"><Search size={14} /><input placeholder="Search employee, org, country…" value={q} onChange={(e) => setQ(e.target.value)} /></div></div>
                  <div className="table">
                    <div className="tr th"><span>Employee</span><span>Country</span><span>Sup Org</span><span>Job Profile</span><span>Status</span></div>
                    {filtered.map((r, i) => (
                      <div className="tr" key={i}>
                        <span><b>{r[dataset.map.firstName]} {r[dataset.map.lastName]}</b><small>{r[dataset.map.employeeId]}</small></span>
                        <span>{r[dataset.map.country]}</span><span>{r[dataset.map.supOrg]}</span><span>{r[dataset.map.jobProfile]}</span>
                        <span><em className={r.__ready ? 'ok' : 'issue'}>{r.__ready ? 'Ready' : 'Remediate'}</em></span>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </section>
        )}

        {page === 4 && (
          <section className="page">
            {!dataset ? (
              <div className="card upload"><Network size={35} /><h2>Organization Designer</h2><p>Upload master data first so Phoenix can infer supervisory organizations.</p><button className="primary" onClick={() => setPage(3)} type="button">Open Master Data</button></div>
            ) : (
              <>
                <div className="dataHead">
                  <div><h2>Organization Structure Designer</h2><p>{stats.orgs.length} proposed organizations from {stats.total} in-scope workers</p></div>
                  <div className="ganttAddBtns">
                    <button className={'secondary ' + (orgView === 'chart' ? 'tabActive' : '')} onClick={() => setOrgView('chart')} type="button"><Network size={14} /> Chart</button>
                    <button className={'secondary ' + (orgView === 'list' ? 'tabActive' : '')} onClick={() => setOrgView('list')} type="button"><ListTree size={14} /> List</button>
                    <button className="secondary" onClick={exportOrgs} type="button"><Download size={14} /> Export</button>
                  </div>
                </div>
                <div className="stats">
                  <div><small>SUP ORGS</small><b>{stats.orgs.length}</b><span>unique values</span></div>
                  <div><small>ROOTS</small><b>{hierarchy.roots.length}</b><span>top-level orgs</span></div>
                  <div className="bad"><small>EXCEPTIONS</small><b>{hierarchy.exceptions.length}</b><span>review items</span></div>
                  <div><small>WORKERS</small><b>{stats.total}</b><span>records</span></div>
                  <div><small>OVERRIDES</small><b>{Object.keys(orgOverrides).length}</b><span>consultant edits</span></div>
                </div>

                {orgView === 'chart' ? (
                  <div className="orgGrid">
                    <div className="card orgList">
                      <div className="title"><div><h2>Proposed hierarchy</h2><p>Derived from manager relationships; consultant overrides applied.</p></div></div>
                      {hierarchy.roots.map((root) => (
                        <OrgNode key={root} name={root} children={hierarchy.children} stats={stats} depth={0} onSelect={openOrgEditor} selected={org} overrides={orgOverrides} />
                      ))}
                    </div>
                    <div className="card orgDetail">
                      {selectedOrg ? (
                        <>
                          <div className="title"><div><h2>{selectedOrg.name}</h2><p>{selectedOrg.count} workers · proposed Workday supervisory organization</p></div><span className="tag">Consultant review</span></div>
                          <div className="orgKpi">
                            <div><small>MANAGER</small><b>{orgOverrides[org]?.manager || selectedOrg.manager}</b></div>
                            <div><small>WORKERS</small><b>{selectedOrg.count}</b></div>
                            <div><small>PARENT</small><b>{hierarchy.parent[selectedOrg.name] || 'Top level / unresolved'}</b></div>
                          </div>
                          <div className="orgEditBox">
                            <b>Edit organization</b>
                            <label>Manager<input value={editManager} onChange={(e) => setEditManager(e.target.value)} /></label>
                            <label>Parent organization
                              <select value={editParent} onChange={(e) => setEditParent(e.target.value)}>
                                <option value="">Top level / no parent</option>
                                {stats.orgRows.filter((o) => o.name !== org).map((o) => <option key={o.name} value={o.name}>{o.name}</option>)}
                              </select>
                            </label>
                            <button className="primary" onClick={saveOrgEdit} type="button">Save override</button>
                            {orgOverrides[org] && <button className="secondary" onClick={() => { const c = { ...orgOverrides }; delete c[org]; setOrgOverrides(c); }} type="button">Reset to inferred</button>}
                          </div>
                          <h3>Worker population</h3>
                          {selectedOrg.people.slice(0, 25).map((p, i) => (
                            <div className="person" key={i}>
                              <span>{String(p[dataset.map.firstName] || '?').slice(0, 1)}</span>
                              <div><b>{p[dataset.map.firstName]} {p[dataset.map.lastName]}</b><small>{p[dataset.map.jobProfile]} · {p[dataset.map.country]}</small></div>
                              <em>{p[dataset.map.employeeId]}</em>
                            </div>
                          ))}
                        </>
                      ) : (
                        <div className="empty"><Network size={30} /><b>Select a supervisory organization</b><small>Inspect manager, parent and worker population; edit if needed.</small></div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="card records">
                    <div className="title"><div><h2>Organization list</h2><p>Click a row to review and edit its parent or manager.</p></div></div>
                    <div className="table">
                      <div className="tr th"><span>Supervisory Org</span><span>Manager</span><span>Parent Organization</span><span>Workers</span><span>Status</span></div>
                      {stats.orgRows.map((o) => {
                        const hasIssue = hierarchy.exceptions.some((x) => x.startsWith(o.name + ':'));
                        return (
                          <div className="tr clickable" key={o.name} onClick={() => openOrgEditor(o.name)}>
                            <span><b>{o.name}</b></span>
                            <span>{orgOverrides[o.name]?.manager || o.manager}</span>
                            <span>{hierarchy.parent[o.name] || 'Top level / unresolved'}</span>
                            <span>{o.count}</span>
                            <span><em className={hasIssue ? 'issue' : 'ok'}>{hasIssue ? 'Exception' : 'OK'}</em></span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="card panel exceptionBox">
                  <div className="title"><div><h2>Organization exceptions</h2><p>Items requiring consultant review.</p></div></div>
                  {hierarchy.exceptions.length ? hierarchy.exceptions.map((e, i) => <div className="issue" key={i}><span>{e}</span><b>Review</b></div>) : <div className="noIssue">No hierarchy exceptions detected in this dataset.</div>}
                </div>
              </>
            )}
          </section>
        )}

        {page === 9 && (
          <section className="page">
            {!dataset ? (
              <div className="card upload"><GitFork size={35} /><h2>Organization Visualizer</h2><p>Upload master data first so Phoenix can draw the supervisory organization chart.</p><button className="primary" onClick={() => setPage(3)} type="button">Open Master Data</button></div>
            ) : (
              <>
                <div className="dataHead">
                  <div><h2>Organization Chart Visualizer</h2><p>{orgViz.layout.nodes.length} of {stats.orgs.length} proposed sup orgs placed in the chart below</p></div>
                  <div className="ganttAddBtns">
                    <button className="secondary" onClick={() => setVizScale((s) => Math.max(0.25, +(s - 0.1).toFixed(2)))} type="button"><ZoomOut size={14} /></button>
                    <button className="secondary" onClick={fitVizToScreen} type="button"><Maximize2 size={14} /> Fit</button>
                    <button className="secondary" onClick={() => setVizScale((s) => Math.min(2, +(s + 0.1).toFixed(2)))} type="button"><ZoomIn size={14} /></button>
                    <button className="secondary" onClick={exportVizSVG} type="button"><Download size={14} /> SVG</button>
                    <button className="secondary" onClick={exportVizPNG} type="button"><Download size={14} /> PNG</button>
                  </div>
                </div>

                <div className="stats">
                  <div><small>SUP ORGS</small><b>{stats.orgs.length}</b><span>total proposed</span></div>
                  <div><small>PLACED</small><b>{orgViz.layout.nodes.length}</b><span>shown in chart</span></div>
                  <div className={orgViz.orphan.length ? 'bad' : 'good'}><small>UNRESOLVED</small><b>{orgViz.orphan.length}</b><span>missing hierarchy data</span></div>
                  <div><small>TOP LEVEL</small><b>{orgViz.resolved.length}</b><span>true root org(s)</span></div>
                  <div><small>ZOOM</small><b>{Math.round(vizScale * 100)}%</b><span>current view</span></div>
                </div>

                {orgViz.orphanDetails.length > 0 && (
                  <div className="card panel vizGapBox">
                    <div className="title"><div><h2>Supervisory data needed before these can be placed</h2><p>{orgViz.orphanDetails.length} organization(s) — {orgViz.orphanDetails.reduce((n, o) => n + o.count, 0)} worker(s) — can't be connected to the chart yet. Fix the details below in the master data (or override them in Org Designer) and the chart will update automatically.</p></div><AlertTriangle size={18} /></div>
                    {orgViz.orphanDetails.map((o) => (
                      <div className="issue vizGapRow" key={o.name}>
                        <span><b>{o.name}</b> <small>({o.count} worker{o.count === 1 ? '' : 's'})</small></span>
                        <div className="vizGapReasons">{o.reasons.map((r, i) => <small key={i}>{r}</small>)}</div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="orgVizLayout">
                  <div className="card vizCanvasCard">
                    <div className="search vizSearch"><Search size={14} /><input placeholder="Find an org or manager in the chart…" value={vizSearch} onChange={(e) => setVizSearch(e.target.value)} /></div>
                    <div className="vizCanvasWrap" ref={svgWrapRef}>
                      {orgViz.layout.nodes.length ? (
                        <svg
                          ref={svgRef}
                          width={orgViz.layout.width}
                          height={orgViz.layout.height}
                          viewBox={`0 0 ${orgViz.layout.width} ${orgViz.layout.height}`}
                          style={{ transform: `scale(${vizScale})`, transformOrigin: '0 0', display: 'block' }}
                        >
                          <rect x="0" y="0" width={orgViz.layout.width} height={orgViz.layout.height} fill="#f6f8fc" />
                          {orgViz.layout.edges.map((e, i) => {
                            const p = vizNodeByName[e.parent];
                            const c = vizNodeByName[e.child];
                            if (!p || !c) return null;
                            const px = p.x + ORG_NODE_W / 2, py = p.y + ORG_NODE_H;
                            const cx = c.x + ORG_NODE_W / 2, cy = c.y;
                            const midY = py + (cy - py) / 2;
                            return <path key={i} d={`M ${px} ${py} V ${midY} H ${cx} V ${cy}`} stroke="#c2cbdb" strokeWidth="1.5" fill="none" />;
                          })}
                          {orgViz.layout.nodes.map((n) => {
                            const orgRow = stats.orgRows.find((o) => o.name === n.name);
                            const isException = hierarchy.exceptions.some((e) => e.startsWith(n.name + ':'));
                            const isMatch = vizSearch.trim() && (norm(n.name).includes(norm(vizSearch)) || norm(orgOverrides[n.name]?.manager || orgRow?.manager).includes(norm(vizSearch)));
                            const isSelected = org === n.name;
                            const manager = orgOverrides[n.name]?.manager || orgRow?.manager || 'Manager not identified';
                            const stroke = isSelected ? '#3867ff' : isMatch ? '#d99a2b' : isException ? '#e2878d' : '#dfe5ee';
                            return (
                              <g key={n.name} transform={`translate(${n.x},${n.y})`} onClick={() => openOrgEditor(n.name)} style={{ cursor: 'pointer' }}>
                                <rect width={ORG_NODE_W} height={ORG_NODE_H} rx="10" fill={isMatch ? '#fff8e9' : isException ? '#fff5f6' : '#ffffff'} stroke={stroke} strokeWidth={isSelected || isMatch ? 2 : 1.2} />
                                <rect width="4" height={ORG_NODE_H} rx="2" fill={isException ? '#d85e6a' : '#3867ff'} />
                                <text x="14" y="21" fontSize="10.5" fontWeight="700" fill="#1c2534">{trunc(n.name, 25)}</text>
                                <text x="14" y="37" fontSize="8.5" fill="#69758a">{trunc(manager, 27)}</text>
                                <text x="14" y="53" fontSize="8" fill="#8b95a6">{orgRow?.count ?? 0} worker{(orgRow?.count ?? 0) === 1 ? '' : 's'}</text>
                                {isException && <text x="14" y="68" fontSize="7.5" fill="#c4525a">⚠ needs review</text>}
                              </g>
                            );
                          })}
                        </svg>
                      ) : (
                        <div className="empty"><GitFork size={30} /><b>No organizations could be placed yet</b><small>Resolve the items listed above, then revisit this chart.</small></div>
                      )}
                    </div>
                    <div className="vizLegend">
                      <span><i className="vizDot" style={{ background: '#3867ff' }} />Normal</span>
                      <span><i className="vizDot" style={{ background: '#d85e6a' }} />Needs review</span>
                      <span><i className="vizDot" style={{ background: '#d99a2b' }} />Search match</span>
                      <span>Click a box to inspect it</span>
                    </div>
                  </div>
                  <div className="card orgDetail vizDetail">
                    {selectedOrg ? (
                      <>
                        <div className="title"><div><h2>{selectedOrg.name}</h2><p>{selectedOrg.count} workers</p></div><span className="tag">Chart selection</span></div>
                        <div className="orgKpi">
                          <div><small>MANAGER</small><b>{orgOverrides[org]?.manager || selectedOrg.manager}</b></div>
                          <div><small>WORKERS</small><b>{selectedOrg.count}</b></div>
                          <div><small>PARENT</small><b>{hierarchy.parent[selectedOrg.name] || 'Top level / unresolved'}</b></div>
                        </div>
                        <button className="secondary" onClick={() => setPage(4)} type="button"><Network size={14} /> Edit in Org Designer</button>
                        <h3>Worker population</h3>
                        {selectedOrg.people.slice(0, 25).map((p, i) => (
                          <div className="person" key={i}>
                            <span>{String(p[dataset.map.firstName] || '?').slice(0, 1)}</span>
                            <div><b>{p[dataset.map.firstName]} {p[dataset.map.lastName]}</b><small>{p[dataset.map.jobProfile]} · {p[dataset.map.country]}</small></div>
                            <em>{p[dataset.map.employeeId]}</em>
                          </div>
                        ))}
                      </>
                    ) : (
                      <div className="empty"><GitFork size={30} /><b>Click a box in the chart</b><small>Select an organization to see its manager, parent and worker population.</small></div>
                    )}
                  </div>
                </div>
              </>
            )}
          </section>
        )}

        {page === 6 && (
          <section className="page">
            <div className="dataHead">
              <div><h2>Business Process Analyzer / Optimizer</h2><p>Compare current-state process flows across the selected countries and identify potential simplification opportunities.</p></div>
              <div className="ganttAddBtns">
                <button className={'secondary ' + (bpView === 'compare' ? 'tabActive' : '')} onClick={() => setBpView('compare')} type="button"><ListChecks size={14} /> Compare</button>
                <button className={'secondary ' + (bpView === 'global' ? 'tabActive' : '')} onClick={() => setBpView('global')} type="button"><Layers size={14} /> Global view</button>
                <label className="secondary"><Upload size={14} /> Upload BP file<input type="file" accept=".xlsx,.xls,.csv" onChange={parseBP} /></label>
              </div>
            </div>
            <div className="stats">
              <div><small>PROCESSES</small><b>{[...new Set(bpScoped.map((x) => x.process))].length}</b><span>current-state processes</span></div>
              <div><small>COUNTRIES</small><b>{[...new Set(bpScoped.map((x) => x.country))].length}</b><span>in scope</span></div>
              <div><small>STEPS</small><b>{bpScoped.length}</b><span>{bpFile || 'demo data'}</span></div>
              <div><small>RECOMMENDATIONS</small><b>{bpAnalysis.reduce((n, x) => n + x.suggestions.length, 0)}</b><span>for consultant review</span></div>
            </div>
            {bpOutOfScopeCountries.length > 0 && (
              <div className="gate scope"><Globe2 size={13} />Uploaded data also includes {bpOutOfScopeCountries.join(', ')}, which {bpOutOfScopeCountries.length > 1 ? 'are' : 'is'} not in the selected implementation scope. Add {bpOutOfScopeCountries.length > 1 ? 'them' : 'it'} in Project Setup to include {bpOutOfScopeCountries.length > 1 ? 'those variants' : 'that variant'} in the comparison.</div>
            )}

            {bpView === 'compare' ? bpAnalysis.map((a) => (
              <div className="card bpCard" key={a.process}>
                <div className="title"><div><h2>{a.process}</h2><p>{a.countries.length} country variant(s) compared</p></div><GitBranch size={18} /></div>
                <div className="bpCols">
                  <div>
                    <h3>Common / global steps</h3>
                    {a.commonSteps.map((s, i) => <div className="step common" key={i}><b>{i + 1}. {s.name}</b><small>Common across compared countries · {s.role}</small></div>)}
                    {!a.commonSteps.length && <div className="noIssue">No common steps detected.</div>}
                  </div>
                  <div>
                    <h3>Country variations</h3>
                    {Object.entries(a.variationsByCountry).flatMap(([country, rows]) => rows.map((v, i) => (
                      <div className="step variation" key={country + i}><b>{country}: {v.name}</b><small>Step {v.step} · {v.role}</small></div>
                    )))}
                    {!Object.keys(a.variationsByCountry).length && <div className="noIssue">No country-specific variation detected.</div>}
                  </div>
                </div>
                {a.suggestions.length > 0 && (
                  <div className="suggestions">
                    <div className="suggestTitle"><Lightbulb size={15} /><b>Optimization suggestions — for consultant review, not auto-applied</b></div>
                    {a.suggestions.map((s, i) => <div className="suggest" key={i}><span>{s.country}</span>{s.text}</div>)}
                  </div>
                )}
              </div>
            )) : (
              bpAnalysis.map((a) => (
                <div className="card bpCard" key={a.process}>
                  <div className="title"><div><h2>{a.process} — global standardization view</h2><p>What can be standardized globally vs. what genuinely needs country-specific variation.</p></div></div>
                  <div className="flowGlobal">
                    {a.commonSteps.map((s, i) => (
                      <React.Fragment key={i}>
                        <div className="flowStep"><b>{s.name}</b><small>{s.role}</small></div>
                        {i < a.commonSteps.length - 1 && <div className="flowArrow">↓</div>}
                      </React.Fragment>
                    ))}
                    {!a.commonSteps.length && <div className="noIssue">No global common steps identified for this process.</div>}
                  </div>
                  <div className="flowVariants">
                    {Object.entries(a.variationsByCountry).map(([country, rows]) => (
                      <div className="flowVariantCol" key={country}>
                        <b>{country}</b>
                        {rows.map((r, i) => <div className="flowVariantStep" key={i}>+ {r.name} <small>({r.role})</small></div>)}
                      </div>
                    ))}
                    {!Object.keys(a.variationsByCountry).length && <div className="noIssue">Every compared country follows the global flow — a strong candidate for full standardization.</div>}
                  </div>
                </div>
              ))
            )}
          </section>
        )}

        {page === 7 && (
          <section className="page">
            <div className="card impactHero"><div><h2>Implementation Impact Analyzer</h2><p>Run a transparent what-if scenario against the current project scope. Rule-based, not an invented AI score.</p></div><RefreshCw size={20} /></div>
            <div className="scenarioGrid">
              <div className="card panel">
                <h2>Scenario</h2>
                <label>Country to add (optional)</label>
                <select value={scenario.country} onChange={(e) => setScenario({ ...scenario, country: e.target.value })}>
                  <option value="">— none —</option>
                  {ALL_COUNTRIES.filter((c) => !inCountryScope(c, form.countries)).map((c) => <option key={c}>{c}</option>)}
                </select>
                <label>Employee population</label>
                <input className="fullInput" type="number" value={scenario.employees} onChange={(e) => setScenario({ ...scenario, employees: e.target.value })} />
                <label>Module to add (optional)</label>
                <select value={scenario.module} onChange={(e) => setScenario({ ...scenario, module: e.target.value })}>
                  <option value="">— none —</option>
                  {MODULES.filter((m) => !form.modules.includes(m)).map((m) => <option key={m}>{m}</option>)}
                </select>
                <label>Business process changed (optional)</label>
                <select value={scenario.process} onChange={(e) => setScenario({ ...scenario, process: e.target.value })}>
                  <option value="">— none —</option>
                  {[...new Set(bpRows.map((r) => r.process))].map((p) => <option key={p}>{p}</option>)}
                </select>
              </div>
              <div className="card panel">
                <h2>Baseline vs Scenario</h2>
                <div className="compare">
                  <div><small>COUNTRIES</small><b>{form.countries.length} → {form.countries.length + (impact.countryAdded ? 1 : 0)}</b></div>
                  <div><small>EMPLOYEES</small><b>{Number(form.employees).toLocaleString()} → {Number(scenario.employees || form.employees).toLocaleString()}</b></div>
                  <div><small>MODULES</small><b>{form.modules.length} → {form.modules.length + (impact.moduleAdded ? 1 : 0)}</b></div>
                </div>
                <h3>What may be impacted, and why</h3>
                {impact.impacts.map((x, i) => <div className="impactItem" key={i}><b>{x[0]}</b><span>{x[1]}</span></div>)}
                {impact.roadmapActivities.length > 0 && (
                  <div className="impactSub"><b>Roadmap activities potentially affected</b><div className="chips">{impact.roadmapActivities.map((a) => <span key={a}>{a}</span>)}</div></div>
                )}
                {impact.testAreas.length > 0 && (
                  <div className="impactSub"><b>Test coverage that may need to be added/updated</b><div className="chips">{impact.testAreas.map((a) => <span key={a}>{a}</span>)}</div></div>
                )}
                {impact.dataAreas.length > 0 && (
                  <div className="impactSub"><b>Configuration / data areas potentially affected</b><div className="chips">{impact.dataAreas.map((a) => <span key={a}>{a}</span>)}</div></div>
                )}
                {impact.existingImpactedTests.length > 0 && (
                  <div className="impactSub">
                    <b>Existing generated test cases that may need review ({impact.existingImpactedTests.length})</b>
                    {impact.existingImpactedTests.slice(0, 6).map((t) => <div className="issue" key={t.id}><span>{t.id} · {t.process} · {t.country}</span><b>{t.testType}</b></div>)}
                  </div>
                )}
              </div>
            </div>
          </section>
        )}

        {page === 8 && (
          <section className="page">
            <div className="dataHead">
              <div><h2>AI-assisted Test Design</h2><p>Generate implementation-specific scenarios from scope, business processes, organization data and available master data.</p></div>
              <button className="primary" onClick={generateTests} type="button"><Sparkles size={14} /> Generate test cases</button>
            </div>
            <div className="card panel testConfig">
              <div className="testConfigRow">
                <div>
                  <b>Test types</b>
                  <div className="checkChips">
                    {TEST_TYPES.map((t) => (
                      <button key={t} type="button" className={testTypes.includes(t) ? 'sel' : ''}
                        onClick={() => setTestTypes(testTypes.includes(t) ? testTypes.filter((x) => x !== t) : [...testTypes, t])}>
                        {testTypes.includes(t) && '✓ '}{t}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <b>Test phase</b>
                  <select value={testPhase} onChange={(e) => setTestPhase(e.target.value)}>
                    {TEST_PHASES.map((p) => <option key={p}>{p}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <b>Countries to generate for <small className="labelHint">— defaults to full project scope</small></b>
                <div className="checkChips">
                  {form.countries.map((c) => (
                    <button key={c} type="button" className={testScopeCountries.includes(c) ? 'sel' : ''}
                      onClick={() => setTestCountries(testScopeCountries.includes(c) ? testScopeCountries.filter((x) => x !== c) : [...testScopeCountries, c])}>
                      {testScopeCountries.includes(c) && '✓ '}{c}
                    </button>
                  ))}
                  {!form.countries.length && <span className="hintText">Select countries in Project Setup first.</span>}
                </div>
              </div>
            </div>
            <div className="stats">
              <div><small>MODULES</small><b>{form.modules.length}</b><span>in scope</span></div>
              <div><small>COUNTRIES</small><b>{testScopeCountries.length}</b><span>selected for generation</span></div>
              <div><small>PROCESSES</small><b>{[...new Set(bpScoped.map((x) => x.process))].length}</b><span>available</span></div>
              <div><small>GENERATED</small><b>{tests.length}</b><span>test cases</span></div>
              <div className="bad"><small>IMPACTED</small><b>{testsWithImpact.filter((t) => t.impacted).length}</b><span>from current scenario</span></div>
            </div>
            {tests.length ? (
              <div className="card testTable">
                <div className="table">
                  <div className="tr th testTr"><span>ID / Process</span><span>Country</span><span>Module / Type</span><span>Scenario &amp; steps</span><span>Expected result</span><span>Priority</span></div>
                  {testsWithImpact.map((t) => (
                    <div className={'tr testTr' + (t.impacted ? ' impactedRow' : '')} key={t.id}>
                      <span><b>{t.id}</b><small>{t.process}</small>{t.impacted && <em className="badgeImpacted">Impacted</em>}</span>
                      <span>{t.country}</span>
                      <span>{t.module}<small>{t.testType} · {t.testPhase}</small></span>
                      <span>{t.scenario}<small>{t.steps.slice(0, 3).join(' · ')}{t.steps.length > 3 ? ' …' : ''}</small></span>
                      <span>{t.expected}</span>
                      <span><em className={t.priority === 'High' ? 'issue' : 'ok'}>{t.priority}</em></span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="card upload"><FlaskConical size={35} /><h2>Generate implementation-specific tests</h2><p>PHOENIX will use the selected countries, available current-state processes, organization structure and implementation context to create an initial test suite for consultant review.</p><button className="primary" onClick={generateTests} type="button">Generate tests</button></div>
            )}
          </section>
        )}

        {page === 5 && (
          <section className="page">
            <div className="card readiness"><Sparkles /><div><h2>Implementation readiness</h2><p>Combined view of project, data, organization and testing signals.</p></div></div>
            <div className="stats">
              <div className="good"><small>DATA READINESS</small><b>{dataset ? pct(stats.ready, stats.total) : 0}%</b><span>in-scope master data</span></div>
              <div><small>ROADMAP</small><b>{weeks} wks</b><span>{conflictCount ? conflictCount + ' dependency conflict(s)' : 'no dependency conflicts'}</span></div>
              <div><small>ORG STRUCTURE</small><b>{dataset ? stats.orgs.length : '—'}</b><span>{dataset ? hierarchy.exceptions.length + ' exceptions' : 'sup orgs identified'}</span></div>
              <div className="bad"><small>OPEN DATA ITEMS</small><b>{dataset ? stats.blocked : '—'}</b><span>records to remediate</span></div>
              <div><small>TEST COVERAGE</small><b>{tests.length}</b><span>generated test cases</span></div>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

createRoot(document.getElementById('root')).render(<App />);
