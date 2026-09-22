// ---------------------------------------------------------------------------
// PHOENIX — shared constants and pure helper functions
// ---------------------------------------------------------------------------

export const FIELDS = [
  ['employeeId', 'Employee ID', ['employee id', 'employee_id', 'worker id', 'worker_id', 'employeeid']],
  ['firstName', 'First Name', ['first name', 'first_name', 'firstname']],
  ['lastName', 'Last Name', ['last name', 'last_name', 'lastname', 'surname']],
  ['hireDate', 'Hire Date', ['hire date', 'hire_date', 'hiredate']],
  ['supOrg', 'Supervisory Organization', ['supervisory organization', 'supervisory org', 'sup org', 'sup_org', 'supervisory_organization']],
  ['jobProfile', 'Job Profile', ['job profile', 'job_profile', 'jobprofile']],
  ['location', 'Location', ['location', 'work location', 'work_location']],
  ['country', 'Country', ['country', 'country name', 'country_name']],
  ['company', 'Company', ['company', 'company name', 'company_name']],
  ['workerType', 'Worker Type', ['worker type', 'worker_type', 'workertype']],
  ['employeeType', 'Employee Type', ['employee type', 'employee_type', 'employeetype']],
  ['manager', 'Manager', ['manager', 'manager name', 'manager_name', 'manager id', 'manager_id']],
];

export const MODULES = ['HCM', 'Compensation', 'Benefits', 'Absence', 'Time Tracking', 'Recruiting', 'Talent & Performance', 'Learning', 'Payroll'];

export const PROCESS_MODULE = {
  Hire: 'HCM', 'Change Job': 'HCM', Termination: 'HCM', Transfer: 'HCM',
  Promotion: 'HCM', Absence: 'Absence', 'Compensation Change': 'Compensation',
};

export const TEST_TYPES = ['Unit', 'SIT', 'E2E', 'UAT', 'Regression'];
export const TEST_PHASES = ['Unit Testing', 'SIT', 'E2E', 'UAT', 'Regression', 'Cutover Rehearsal'];

export const ALL_COUNTRIES = [
  'Australia', 'Austria', 'Belgium', 'Brazil', 'Canada', 'China', 'Denmark', 'Finland', 'France',
  'Germany', 'Hong Kong', 'India', 'Indonesia', 'Ireland', 'Italy', 'Japan', 'Malaysia', 'Mexico',
  'Netherlands', 'New Zealand', 'Norway', 'Philippines', 'Poland', 'Singapore', 'South Africa',
  'South Korea', 'Spain', 'Sweden', 'Switzerland', 'Thailand', 'United Arab Emirates',
  'United Kingdom', 'United States', 'Vietnam',
];

export const BASE = [
  ['Planning & Discovery', 1, 2, 'Design & discovery', 'blue'],
  ['Design & Configuration', 3, 4, 'Design & discovery', 'purple'],
  ['Design & Config — BP + Security', 5, 6, 'Design & discovery', 'indigo'],
  ['Data Profiling & Cleansing', 5, 8, 'Data workstream', 'teal'],
  ['Acquisition — parallel lane', 5, 8, 'Acquisition lane', 'orange'],
  ['Data Migration — Mock Load 1', 7, 7, 'Data workstream', 'teal'],
  ['Data Migration — Mock Load 2', 8, 8, 'Data workstream', 'teal'],
  ['E2E & Integration Testing', 8, 9, 'Testing / UAT', 'green'],
  ['UAT & Readiness', 9, 9, 'Testing / UAT', 'pink'],
  ['Cutover Rehearsal & Readiness', 9, 10, 'Cutover & readiness', 'amber'],
  ['Final Readiness & Sign-off', 11, 11, 'Cutover & readiness', 'amber'],
  ['Go-Live', 12, 12, 'Go-live & hypercare', 'red'],
  ['Hypercare / Extended Stabilization', 13, 14, 'Go-live & hypercare', 'slate'],
];

export const BP_DEFAULTS_RAW = [
  ['Hire', 'India', 1, 'Initiation', 'HR Recruiter', 'Required'],
  ['Hire', 'India', 2, 'HRBP Review', 'HRBP', 'Required'],
  ['Hire', 'India', 3, 'Manager Review', 'Hiring Manager', 'Required'],
  ['Hire', 'India', 4, 'Manager Approval', 'Hiring Manager', 'Required'],
  ['Hire', 'India', 5, 'HR Approval', 'HR Operations', 'Required'],
  ['Hire', 'United States', 1, 'Initiation', 'HR Recruiter', 'Required'],
  ['Hire', 'United States', 2, 'HRBP Review', 'HRBP', 'Required'],
  ['Hire', 'United States', 3, 'Manager Review', 'Hiring Manager', 'Required'],
  ['Hire', 'United States', 4, 'Manager Approval', 'Hiring Manager', 'Required'],
  ['Hire', 'United States', 5, "Manager's Manager Approval", "Manager's Manager", 'Country-specific'],
  ['Hire', 'United States', 6, "Manager's Manager +1 Approval", "Manager's Manager +1", 'Country-specific'],
  ['Hire', 'United States', 7, 'HR Approval', 'HR Operations', 'Required'],
  ['Hire', 'Canada', 1, 'Initiation', 'HR Recruiter', 'Required'],
  ['Hire', 'Canada', 2, 'HRBP Review', 'HRBP', 'Required'],
  ['Hire', 'Canada', 3, 'Manager Review', 'Hiring Manager', 'Required'],
  ['Hire', 'Canada', 4, 'Manager Approval', 'Hiring Manager', 'Required'],
  ['Hire', 'Canada', 5, 'HR Approval', 'HR Operations', 'Required'],
  ['Hire', 'United Kingdom', 1, 'Initiation', 'HR Recruiter', 'Required'],
  ['Hire', 'United Kingdom', 2, 'HRBP Review', 'HRBP', 'Required'],
  ['Hire', 'United Kingdom', 3, 'Manager Review', 'Hiring Manager', 'Required'],
  ['Hire', 'United Kingdom', 4, 'Manager Approval', 'Hiring Manager', 'Required'],
  ['Hire', 'United Kingdom', 5, 'HR Review', 'HR Operations', 'Potentially repetitive'],
  ['Hire', 'United Kingdom', 6, 'HR Approval', 'HR Operations', 'Required'],
  ['Change Job', 'India', 1, 'Initiation', 'HR Partner', 'Required'],
  ['Change Job', 'India', 2, 'Manager Review', 'Manager', 'Required'],
  ['Change Job', 'India', 3, 'HRBP Review', 'HRBP', 'Required'],
  ['Change Job', 'India', 4, 'HR Approval', 'HR Operations', 'Required'],
  ['Change Job', 'United States', 1, 'Initiation', 'HR Partner', 'Required'],
  ['Change Job', 'United States', 2, 'Manager Review', 'Manager', 'Required'],
  ['Change Job', 'United States', 3, 'HRBP Review', 'HRBP', 'Required'],
  ['Change Job', 'United States', 4, "Manager's Manager Approval", "Manager's Manager", 'Country-specific'],
  ['Change Job', 'United States', 5, 'HR Approval', 'HR Operations', 'Required'],
];

export const BP_DEFAULTS = BP_DEFAULTS_RAW.map((x) => ({
  process: x[0], country: x[1], step: x[2], name: x[3], role: x[4], classification: x[5],
}));

export const TX = [
  ['Hire', 'hire'], ['Termination', 'termination'], ['Promotion', 'promotion'],
  ['Transfer', 'transfer'], ['Compensation Change', 'compensation'], ['Absence', 'absence'],
];

export const pct = (a, b) => (b ? Math.round((a / b) * 100) : 0);
export const norm = (x) => String(x ?? '').toLowerCase().trim().replace(/[^a-z0-9]+/g, ' ');

// Does a row's country fall inside the consultant's selected implementation scope?
// An empty scope means "no filter applied" so nothing is silently hidden.
export const inCountryScope = (rowCountry, countries) => {
  if (!countries || !countries.length) return true;
  const rc = norm(rowCountry);
  if (!rc) return false;
  return countries.some((c) => norm(c) === rc);
};

export function headerMap(headers) {
  const m = {};
  for (const [key, , aliases] of FIELDS) {
    m[key] = headers.find((h) => aliases.map(norm).includes(norm(h))) || null;
  }
  return m;
}

export function analyzeMasterData(rows) {
  const headers = rows.length ? Object.keys(rows[0]) : [];
  const map = headerMap(headers);
  const data = rows.map((r, i) => {
    const missing = [];
    FIELDS.forEach(([k, l]) => {
      if (!map[k] || String(r[map[k]] ?? '').trim() === '') missing.push(l);
    });
    return { ...r, __row: i + 2, __missing: missing, __ready: missing.length === 0 };
  });
  return { headers, map, rows: data };
}

export function sampleMasterData() {
  const labels = FIELDS.map((x) => x[1]);
  const vals = [
    ['E0001', 'Maya', 'Sharma', '2018-01-01', 'Corporate Leadership', 'CEO', 'New York', 'United States', 'Phoenix US', 'Employee', 'Regular', ''],
    ['E0002', 'Aisha', 'Nair', '2019-02-01', 'Human Resources', 'Chief People Officer', 'Bengaluru', 'India', 'Phoenix India', 'Employee', 'Regular', 'Maya Sharma'],
    ['E0003', 'Arjun', 'Menon', '2019-03-01', 'Finance', 'Chief Financial Officer', 'Mumbai', 'India', 'Phoenix India', 'Employee', 'Regular', 'Maya Sharma'],
    ['E0004', 'Daniel', 'Williams', '2019-04-01', 'Technology', 'Chief Technology Officer', 'New York', 'United States', 'Phoenix US', 'Employee', 'Regular', 'Maya Sharma'],
    ['E0005', 'Olivia', 'Brown', '2020-01-01', 'Product', 'Chief Product Officer', 'San Francisco', 'United States', 'Phoenix US', 'Employee', 'Regular', 'Daniel Williams'],
    ['E0006', 'Ryan', 'Thomas', '2020-02-01', 'Operations', 'Chief Operating Officer', 'Chicago', 'United States', 'Phoenix US', 'Employee', 'Regular', 'Maya Sharma'],
    ['E0007', 'Priya', 'Joseph', '2020-03-01', 'Benefits', 'Benefits Director', 'Kochi', 'India', 'Phoenix India', 'Employee', 'Regular', 'Aisha Nair'],
    ['E0008', 'Vikram', 'Kumar', '2020-04-01', 'Compensation', 'Compensation Director', 'Bengaluru', 'India', 'Phoenix India', 'Employee', 'Regular', 'Aisha Nair'],
    ['E0009', 'Emma', 'Wilson', '2020-05-01', 'Global Services', 'VP Global Services', 'London', 'United Kingdom', 'Phoenix UK', 'Employee', 'Regular', 'Ryan Thomas'],
    ['E0010', 'James', 'Taylor', '2020-06-01', 'IT Security', 'IT Security Director', 'Toronto', 'Canada', 'Phoenix Canada', 'Employee', 'Regular', 'Daniel Williams'],
    ['E0011', 'Sofia', 'Rossi', '2021-01-05', 'Finance Operations', 'Finance Manager', 'Milan', 'Italy', 'Phoenix Italy', 'Employee', 'Regular', 'Arjun Menon'],
    ['E0012', 'Noah', 'Becker', '2021-02-10', 'Technology Delivery', 'Engineering Manager', 'Berlin', 'Germany', 'Phoenix Germany', 'Employee', 'Regular', 'Daniel Williams'],
  ];
  return vals.map((a) => Object.fromEntries(labels.map((l, i) => [l, a[i]])));
}

// Build a 12-week-baseline roadmap, scaled to an arbitrary duration in weeks.
export function buildRoadmap(w) {
  const scaled = BASE.map((x, i) => {
    const [name, s, e, l, c] = x;
    if (i === 12) return { name, s: w + 1, e: w + Math.max(2, Math.round(w / 6)), l, c };
    if (i === 11) return { name, s: w, e: w, l, c };
    if (w === 12) return { name, s, e, l, c };
    const cap = Math.max(1, w - 1);
    const ns = Math.min(cap, Math.max(1, Math.round(((s - 1) * w) / 12) + 1));
    const ne = Math.min(cap, Math.max(ns, Math.round((e * w) / 12)));
    return { name, s: ns, e: ne, l, c };
  });
  const owners = ['PM', 'HCM', 'Data', 'Testing'];
  const tasks = scaled.map((x, i) => ({
    ...x,
    id: i + 1,
    owner: owners[i % 4],
    notes: '',
    type: x.name === 'Go-Live' ? 'milestone' : 'activity',
    dependsOn: null,
  }));
  const byName = (name) => tasks.find((t) => t.name === name)?.id || null;
  tasks.forEach((t) => {
    if (t.name === 'UAT & Readiness') t.dependsOn = byName('E2E & Integration Testing');
    if (t.name === 'Final Readiness & Sign-off') t.dependsOn = byName('UAT & Readiness');
    if (t.name === 'Go-Live') t.dependsOn = byName('Final Readiness & Sign-off');
  });
  return tasks;
}

// Flag any task that starts before the task it depends on has finished.
export function validateDependencies(tasks) {
  return tasks.map((t) => {
    if (!t.dependsOn) return { ...t, conflict: null };
    const dep = tasks.find((x) => x.id === t.dependsOn);
    if (dep && t.s < dep.e) {
      return { ...t, conflict: `Starts in W${t.s}, before its dependency "${dep.name}" finishes in W${dep.e}.` };
    }
    return { ...t, conflict: null };
  });
}

// Compare current-state business-process steps across countries: common vs. variant steps,
// plus explainable optimization suggestions (never auto-applied).
export function analyzeBusinessProcesses(rows) {
  const byProcess = {};
  rows.forEach((r) => {
    if (!byProcess[r.process]) byProcess[r.process] = {};
    if (!byProcess[r.process][r.country]) byProcess[r.process][r.country] = [];
    byProcess[r.process][r.country].push(r);
  });
  const sig = (r) => norm(r.name);
  return Object.entries(byProcess).map(([process, byCountry]) => {
    const countries = Object.keys(byCountry);
    const sets = countries.map((c) => [c, byCountry[c].slice().sort((a, b) => a.step - b.step)]);
    const commonSigsOrdered = sets.length
      ? [...new Set(sets[0][1].map(sig))].filter((s) => sets.every(([, rs]) => rs.some((r) => sig(r) === s)))
      : [];
    const commonSteps = commonSigsOrdered.map((s) => {
      const row = sets[0][1].find((r) => sig(r) === s);
      return { name: row.name, role: row.role };
    });
    const variationsByCountry = {};
    sets.forEach(([country, rs]) => {
      const extra = rs.filter((r) => !commonSigsOrdered.includes(sig(r)));
      if (extra.length) variationsByCountry[country] = extra;
    });
    const suggestions = [];
    sets.forEach(([country, rs]) => {
      for (let i = 1; i < rs.length; i++) {
        const prev = rs[i - 1];
        const cur = rs[i];
        if (norm(prev.role) && norm(prev.role) === norm(cur.role)) {
          suggestions.push({
            country,
            text: `"${prev.name}" and "${cur.name}" are both performed by ${cur.role}; review whether these can be combined into a single step.`,
          });
        }
        if (/repetitive/i.test(cur.classification || '')) {
          suggestions.push({
            country,
            text: `"${cur.name}" is flagged as potentially repetitive in the uploaded data; validate whether it duplicates an earlier control.`,
          });
        }
      }
    });
    const approvalCounts = sets.map(([c, rs]) => [c, rs.filter((r) => /approv/i.test(r.name)).length]);
    const maxApprovals = Math.max(0, ...approvalCounts.map((x) => x[1]));
    approvalCounts.forEach(([c, n]) => {
      if (n === maxApprovals && n > 2) {
        suggestions.push({
          country: c,
          text: `${c} has ${n} approval steps for ${process}, more than the other compared countries; confirm each layer is a genuine control requirement rather than a legacy habit.`,
        });
      }
    });
    return { process, countries, sets, commonSteps, variationsByCountry, suggestions };
  });
}

// ---------------------------------------------------------------------------
// Organization Visualizer — pure tree-layout helper.
// Additive only: consumes the same { roots, children, exceptions, parent }
// hierarchy already inferred for the Organization Designer; does not change
// how that hierarchy is derived.
// ---------------------------------------------------------------------------

export const ORG_NODE_W = 210;
export const ORG_NODE_H = 76;
export const ORG_H_GAP = 26;
export const ORG_V_GAP = 58;

// A root org is only a genuine top-of-hierarchy if it isn't a root because
// its manager chain could not be resolved (missing/invalid data).
export function splitOrgRoots(roots, exceptions) {
  const resolved = [];
  const orphan = [];
  roots.forEach((name) => {
    (exceptions.some((e) => e.startsWith(name + ':')) ? orphan : resolved).push(name);
  });
  return { resolved, orphan };
}

// Left-to-right, top-down tree layout for one or more resolved root orgs.
// Guards against circular reporting chains (which the underlying hierarchy
// inference only partly detects) so the layout never recurses forever.
export function buildOrgChartLayout(rootNames, childrenMap) {
  const nodes = [];
  const edges = [];
  const cycles = [];
  let cursor = 0;

  function place(name, depth, ancestry) {
    const rawKids = childrenMap[name] || [];
    const kids = rawKids.filter((k) => {
      if (ancestry.has(k)) {
        cycles.push({
          parent: name,
          child: k,
          message: `"${k}" also reports (directly or indirectly) up to "${name}" — circular reporting chain; "${k}" and everything below it is left out of the chart.`,
        });
        return false;
      }
      return true;
    });
    let x;
    if (!kids.length) {
      x = cursor * (ORG_NODE_W + ORG_H_GAP);
      cursor += 1;
    } else {
      const nextAncestry = new Set(ancestry);
      nextAncestry.add(name);
      const childXs = kids.map((k) => { edges.push({ parent: name, child: k }); return place(k, depth + 1, nextAncestry); });
      x = (Math.min(...childXs) + Math.max(...childXs)) / 2;
    }
    const y = depth * (ORG_NODE_H + ORG_V_GAP);
    nodes.push({ name, x, y, depth, hasChildren: kids.length > 0 });
    return x;
  }

  rootNames.forEach((r) => place(r, 0, new Set()));

  const maxX = nodes.length ? Math.max(...nodes.map((n) => n.x)) : 0;
  const maxDepth = nodes.length ? Math.max(...nodes.map((n) => n.depth)) : 0;
  return {
    nodes,
    edges,
    cycles,
    width: nodes.length ? maxX + ORG_NODE_W + 40 : 0,
    height: nodes.length ? (maxDepth + 1) * (ORG_NODE_H + ORG_V_GAP) + 40 : 0,
  };
}

export const trunc = (s, n) => {
  const str = String(s ?? '');
  return str.length > n ? str.slice(0, n - 1) + '…' : str;
};

// Explain, per un-placed org, why it couldn't be drawn in the visualizer chart
// — either it has its own hierarchy exception, it sits below a circular link
// that had to be cut, or its whole reporting chain leads up to an org that
// does. Lets the consultant fix the actual root cause rather than guessing.
export function diagnoseUnplacedOrgs(allNames, placedNames, parentMap, exceptions, cutByChild) {
  const placedSet = new Set(placedNames);
  const unplaced = allNames.filter((n) => !placedSet.has(n));
  return unplaced.map((name) => {
    const own = exceptions.filter((e) => e.startsWith(name + ':')).map((e) => e.slice(name.length + 2));
    if (own.length) return { name, reasons: own };
    if (cutByChild[name]) {
      return { name, reasons: [`Sits below "${cutByChild[name]}" but was left out to break a circular reporting chain — review the manager relationship between the two.`] };
    }
    let cur = name;
    const seen = new Set();
    while (parentMap[cur] && !seen.has(cur)) {
      seen.add(cur);
      cur = parentMap[cur];
    }
    const blockerReasons = exceptions.filter((e) => e.startsWith(cur + ':')).map((e) => e.slice(cur.length + 2));
    return {
      name,
      reasons: blockerReasons.length
        ? [`Reports up through "${cur}", which is unresolved: ${blockerReasons.join('; ')}`]
        : [`Reports up through "${cur}", which could not be placed in the chart — check that chain of managers.`],
    };
  });
}
