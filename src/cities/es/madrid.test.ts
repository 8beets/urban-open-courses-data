import assert from 'node:assert/strict';
import { test } from 'node:test';
import { madrid } from './madrid.ts';

const header =
  '"ORGANISMO_DESC";"ACTIVIDAD_DESC";"GRUPO_DESC";"DESTINATARIO_DESC";"NUM_PLAZAS_LIBRES";' +
  ['LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES', 'SABADO', 'DOMINGO']
    .map((d) => `"DURACION_ACTIVIDAD_${d}";"HORA_INICIO_${d}"`)
    .join(';');
const row = (organism: string, free: string, days: string) =>
  `"${organism}";"BAILE EN LÍNEA";"GRUPO Nº I";"ADULTOS ";${free};${days}`;
const empty = Array(14).fill('""');

test('converts rows to UrbanLabs records grouped by centre', () => {
  const mondayWednesday = [...empty];
  mondayWednesday.splice(0, 2, '"1 Hora"', '"19:00"');
  mondayWednesday.splice(4, 2, '"1 Hora"', '"19:00"');
  const csv = [
    `﻿${header}`,
    row('C.C. ""CLARA DEL REY""', '0', mondayWednesday.join(';')),
    row('C.C. USERA', '3', empty.join(';')),
  ].join('\r\n');
  const centres = [
    {
      id: 'cc-clara',
      officialUrl: 'https://www.madrid.es/clara',
      registration: { platform: 'madrid-datos-cursos', organism: 'C.C. "CLARA DEL REY"' },
    },
  ];

  const { centres: records, unmatched } = madrid.convert(csv, centres);

  assert.deepEqual(unmatched, { 'C.C. USERA': 1 });
  const [record] = records['cc-clara']!;
  assert.equal(record!.title, 'BAILE EN LÍNEA');
  assert.equal(record!.scheduleText, 'Lunes y miércoles, 19:00 (1 hora)');
  assert.equal(record!.isSoldOut, true);
  assert.equal(record!.officialUrl, 'https://www.madrid.es/clara');
  assert.match(record!.externalId, /^baile-en-linea-[0-9a-f]{12}$/);

  const listed = madrid.centres(csv, centres);
  assert.deepEqual(
    listed.map((c) => c.id),
    ['cc-clara', 'cc-mad-centro-cultural-usera'],
  );
  assert.equal(listed[0], centres[0]);
  assert.equal(listed[1]!.registration.organism, 'C.C. USERA');
  assert.match(listed[1]!.officialUrl, /^TODO/);
});
