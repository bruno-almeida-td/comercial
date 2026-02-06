import { google } from "googleapis";
import { Participant, Quota } from "@/types";
import { SHEET_NAMES, PARTICIPANT_HEADERS, QUOTA_HEADERS } from "./constants";

function getAuth() {
  const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n");
  return new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: privateKey,
    },
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
}

function getSheets() {
  return google.sheets({ version: "v4", auth: getAuth() });
}

const SPREADSHEET_ID = process.env.GOOGLE_SHEET_ID!;

async function ensureSheetExists(sheetName: string, headers: string[]) {
  const sheets = getSheets();

  try {
    const spreadsheet = await sheets.spreadsheets.get({
      spreadsheetId: SPREADSHEET_ID,
    });

    const sheetExists = spreadsheet.data.sheets?.some(
      (s) => s.properties?.title === sheetName
    );

    if (!sheetExists) {
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId: SPREADSHEET_ID,
        requestBody: {
          requests: [
            {
              addSheet: {
                properties: { title: sheetName },
              },
            },
          ],
        },
      });

      await sheets.spreadsheets.values.update({
        spreadsheetId: SPREADSHEET_ID,
        range: `${sheetName}!A1`,
        valueInputOption: "RAW",
        requestBody: { values: [headers] },
      });
    }
  } catch (error) {
    console.error(`Error ensuring sheet ${sheetName} exists:`, error);
    throw error;
  }
}

// --- Participants ---

export async function getParticipants(): Promise<Participant[]> {
  await ensureSheetExists(SHEET_NAMES.PARTICIPANTS, PARTICIPANT_HEADERS);
  const sheets = getSheets();

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `${SHEET_NAMES.PARTICIPANTS}!A2:N`,
  });

  const rows = response.data.values || [];
  return rows.map((row) => ({
    id: row[0] || "",
    nome: row[1] || "",
    email: row[2] || "",
    cargo: row[3] || "",
    whatsapp: row[4] || "",
    empresa: row[5] || "",
    cpf: row[6] || "",
    nomeCredencial: row[7] || "",
    empresaCredencial: row[8] || "",
    necessidadesEspeciais: row[9] || "",
    atendimentoEspecifico: row[10] || "",
    vendedor: row[11] || "",
    cota: row[12] || "",
    dataCadastro: row[13] || "",
  }));
}

export async function addParticipant(
  data: Omit<Participant, "id" | "dataCadastro">
): Promise<Participant> {
  await ensureSheetExists(SHEET_NAMES.PARTICIPANTS, PARTICIPANT_HEADERS);
  const sheets = getSheets();

  const id = `P-${Date.now()}`;
  const dataCadastro = new Date().toLocaleString("pt-BR", {
    timeZone: "America/Sao_Paulo",
  });

  const row = [
    id,
    data.nome,
    data.email,
    data.cargo,
    data.whatsapp,
    data.empresa,
    data.cpf,
    data.nomeCredencial,
    data.empresaCredencial,
    data.necessidadesEspeciais,
    data.atendimentoEspecifico,
    data.vendedor,
    data.cota,
    dataCadastro,
  ];

  await sheets.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range: `${SHEET_NAMES.PARTICIPANTS}!A:N`,
    valueInputOption: "RAW",
    requestBody: { values: [row] },
  });

  // If participant is associated with a quota, update used count
  if (data.cota) {
    await incrementQuotaUsage(data.cota);
  }

  return { ...data, id, dataCadastro };
}

// --- Quotas ---

export async function getQuotas(): Promise<Quota[]> {
  await ensureSheetExists(SHEET_NAMES.QUOTAS, QUOTA_HEADERS);
  const sheets = getSheets();

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `${SHEET_NAMES.QUOTAS}!A2:E`,
  });

  const rows = response.data.values || [];
  return rows.map((row) => ({
    id: row[0] || "",
    parceiro: row[1] || "",
    quantidade: parseInt(row[2] || "0", 10),
    usados: parseInt(row[3] || "0", 10),
    dataCriacao: row[4] || "",
  }));
}

export async function addQuota(
  parceiro: string,
  quantidade: number
): Promise<Quota> {
  await ensureSheetExists(SHEET_NAMES.QUOTAS, QUOTA_HEADERS);
  const sheets = getSheets();

  const id = `Q-${Date.now()}`;
  const dataCriacao = new Date().toLocaleString("pt-BR", {
    timeZone: "America/Sao_Paulo",
  });

  const row = [id, parceiro, quantidade.toString(), "0", dataCriacao];

  await sheets.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range: `${SHEET_NAMES.QUOTAS}!A:E`,
    valueInputOption: "RAW",
    requestBody: { values: [row] },
  });

  return { id, parceiro, quantidade, usados: 0, dataCriacao };
}

export async function deleteQuota(quotaId: string): Promise<boolean> {
  await ensureSheetExists(SHEET_NAMES.QUOTAS, QUOTA_HEADERS);
  const sheets = getSheets();

  // First check if any participants are using this quota
  const participants = await getParticipants();
  const quotas = await getQuotas();
  const quota = quotas.find((q) => q.id === quotaId);

  if (!quota) return false;

  const hasParticipants = participants.some((p) => p.cota === quota.parceiro);
  if (hasParticipants) {
    throw new Error(
      "Não é possível excluir cota com cadastros associados"
    );
  }

  // Find the row index
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `${SHEET_NAMES.QUOTAS}!A:A`,
  });

  const rows = response.data.values || [];
  const rowIndex = rows.findIndex((row) => row[0] === quotaId);

  if (rowIndex === -1) return false;

  // Get sheet ID
  const spreadsheet = await sheets.spreadsheets.get({
    spreadsheetId: SPREADSHEET_ID,
  });
  const sheet = spreadsheet.data.sheets?.find(
    (s) => s.properties?.title === SHEET_NAMES.QUOTAS
  );
  const sheetId = sheet?.properties?.sheetId;

  if (sheetId === undefined) return false;

  await sheets.spreadsheets.batchUpdate({
    spreadsheetId: SPREADSHEET_ID,
    requestBody: {
      requests: [
        {
          deleteDimension: {
            range: {
              sheetId,
              dimension: "ROWS",
              startIndex: rowIndex,
              endIndex: rowIndex + 1,
            },
          },
        },
      ],
    },
  });

  return true;
}

async function incrementQuotaUsage(parceiro: string): Promise<void> {
  const sheets = getSheets();

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `${SHEET_NAMES.QUOTAS}!A:E`,
  });

  const rows = response.data.values || [];
  const rowIndex = rows.findIndex((row) => row[1] === parceiro);

  if (rowIndex === -1) return;

  const currentUsed = parseInt(rows[rowIndex][3] || "0", 10);

  await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range: `${SHEET_NAMES.QUOTAS}!D${rowIndex + 1}`,
    valueInputOption: "RAW",
    requestBody: { values: [[String(currentUsed + 1)]] },
  });
}
