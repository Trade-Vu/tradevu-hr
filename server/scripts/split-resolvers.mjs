import fs from 'fs';
import * as parser from '@babel/parser';
import _traverse from '@babel/traverse';
const traverse = _traverse.default || _traverse;
import _generator from '@babel/generator';
const generate = _generator.default || _generator;
import * as t from '@babel/types';

const code = fs.readFileSync('../src/graphql/resolvers.js', 'utf8');

const ast = parser.parse(code, {
  sourceType: 'module',
  plugins: ['jsx']
});

let queryProps = [];
let mutationProps = [];
let typeResolvers = {};
let topLevelStmts = [];

traverse(ast, {
  ExportNamedDeclaration(path) {
    if (path.node.declaration && path.node.declaration.declarations) {
      const decl = path.node.declaration.declarations[0];
      if (decl.id.name === 'resolvers') {
        decl.init.properties.forEach(prop => {
          if (prop.key.name === 'Query') {
            queryProps = prop.value.properties;
          } else if (prop.key.name === 'Mutation') {
            mutationProps = prop.value.properties;
          } else {
            typeResolvers[prop.key.name] = prop;
          }
        });
        path.skip();
      }
    }
  },
  Program(path) {
    path.node.body.forEach(node => {
      if (node.type !== 'ExportNamedDeclaration' || !node.declaration || node.declaration.declarations?.[0]?.id?.name !== 'resolvers') {
        topLevelStmts.push(node);
      }
    });
  }
});

const topLevelCode = topLevelStmts.map(stmt => generate(stmt).code).join('\n\n');

const mapping = {
  auth: { q: ['me'], m: ['login', 'register'], t: [] },
  org: { q: ['organization'], m: ['updateOrganizationSettings'], t: [] },
  admin: { q: ['auditLogs', 'compensationBands'], m: ['createCompensationBand', 'updateCompensationBand', 'deleteCompensationBand'], t: [] },
  employee: { q: ['employees', 'employee', 'searchEmployees'], m: ['createEmployee', 'updateEmployee', 'importEmployees', 'terminateEmployee'], t: ['Employee', 'User'] },
  leave: { q: ['leaveTypes', 'leaveRequests', 'paginatedLeaveRequests', 'myLeavePlans', 'teamLeavePlans'], m: ['createLeaveType', 'updateLeaveType', 'deleteLeaveType', 'createLeaveRequest', 'approveLeaveRequest', 'rejectLeaveRequest', 'submitLeavePlan', 'approveLeavePlan', 'rejectLeavePlan'], t: ['LeavePlan'] },
  attendance: { q: ['attendanceRecords'], m: ['clockIn', 'clockOut', 'importAttendance'], t: ['Attendance'] },
  payroll: { q: ['salaryHistory', 'payrollRuns', 'payrollRecords', 'myPayrollRecords'], m: ['createPayrollRun', 'processPayrollRun', 'approvePayrollRun', 'deletePayrollRun'], t: [] },
  documents: { q: ['documents', 'documentHistory', 'getCloudinarySignature'], m: ['createDocument', 'updateDocument', 'archiveDocument', 'addDocumentVersion'], t: [] },
  notifications: { q: ['notifications'], m: ['markNotificationRead', 'markAllNotificationsRead'], t: [] },
  approvals: { q: ['promotionRequests', 'previewPromotionBenefits', 'profileUpdateRequests'], m: ['approvePromotionRequest', 'rejectPromotionRequest', 'submitProfileUpdateRequest', 'approveProfileUpdate', 'rejectProfileUpdate'], t: ['PromotionRequest'] },
  performance: { q: ['goals', 'checkIns'], m: ['createGoal', 'updateGoal', 'deleteGoal', 'createCheckIn', 'updateCheckIn'], t: [] },
  policy: { q: ['policies', 'announcements'], m: ['createPolicy', 'updatePolicy', 'deletePolicy', 'createAnnouncement', 'updateAnnouncement', 'deleteAnnouncement'], t: [] },
};

// Ensure output dir exists
if (!fs.existsSync('../src/graphql/resolvers')) {
  fs.mkdirSync('../src/graphql/resolvers');
}

const indexImports = [];
const indexExports = [];

for (const [domain, config] of Object.entries(mapping)) {
  const qProps = queryProps.filter(p => config.q.includes(p.key.name));
  const mProps = mutationProps.filter(p => config.m.includes(p.key.name));
  const tProps = config.t.map(name => typeResolvers[name]).filter(Boolean);

  let fileContent = topLevelCode + '\n\n';
  fileContent += `export const ${domain}Resolvers = {\n`;
  if (qProps.length > 0) {
    fileContent += `  Query: {\n${qProps.map(p => generate(p).code).join(',\n')}\n  },\n`;
  }
  if (mProps.length > 0) {
    fileContent += `  Mutation: {\n${mProps.map(p => generate(p).code).join(',\n')}\n  },\n`;
  }
  if (tProps.length > 0) {
    fileContent += `${tProps.map(p => generate(p).code).join(',\n')}\n`;
  }
  fileContent += `};\n`;

  fs.writeFileSync(`../src/graphql/resolvers/${domain}.resolver.js`, fileContent);
  
  indexImports.push(`import { ${domain}Resolvers } from './${domain}.resolver.js';`);
  indexExports.push(`${domain}Resolvers`);
}

// Write remaining unmapped resolvers to 'misc' just in case
const allMappedQ = Object.values(mapping).flatMap(c => c.q);
const allMappedM = Object.values(mapping).flatMap(c => c.m);
const allMappedT = Object.values(mapping).flatMap(c => c.t);

const unmappedQ = queryProps.filter(p => !allMappedQ.includes(p.key.name));
const unmappedM = mutationProps.filter(p => !allMappedM.includes(p.key.name));
const unmappedT = Object.keys(typeResolvers).filter(k => !allMappedT.includes(k)).map(k => typeResolvers[k]);

if (unmappedQ.length > 0 || unmappedM.length > 0 || unmappedT.length > 0) {
  let miscContent = topLevelCode + '\n\n';
  miscContent += `export const miscResolvers = {\n`;
  if (unmappedQ.length > 0) miscContent += `  Query: {\n${unmappedQ.map(p => generate(p).code).join(',\n')}\n  },\n`;
  if (unmappedM.length > 0) miscContent += `  Mutation: {\n${unmappedM.map(p => generate(p).code).join(',\n')}\n  },\n`;
  if (unmappedT.length > 0) miscContent += `${unmappedT.map(p => generate(p).code).join(',\n')}\n`;
  miscContent += `};\n`;
  
  fs.writeFileSync(`../src/graphql/resolvers/misc.resolver.js`, miscContent);
  indexImports.push(`import { miscResolvers } from './misc.resolver.js';`);
  indexExports.push(`miscResolvers`);
}

const indexContent = `import merge from 'lodash.merge';\n${indexImports.join('\n')}\n\nexport const resolvers = merge(\n  ${indexExports.join(',\n  ')}\n);\n`;
fs.writeFileSync(`../src/graphql/resolvers/index.js`, indexContent);
console.log('Split complete!');
