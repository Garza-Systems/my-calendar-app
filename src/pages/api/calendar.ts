import type { APIRoute } from "astro";
import { addMonths } from "date-fns";

const GRIST_API_KEY = import.meta.env.GRIST_API_KEY;
const GRIST_DOC_ID = import.meta.env.GRIST_DOC_ID;
const GRIST_BASE_URL = import.meta.env.GRIST_BASE_URL;
const GRIST_TABLE_ID = import.meta.env.GRIST_TABLE_ID;

interface GristRecord {
  id: number;
  fields: {
    date: number;
    amount: number;
    description: string;
  };
}

interface Event {
  uid: string;
  start: string;
  end: string;
  summary: string;
  description: string;
}

async function getTransactions(): Promise<GristRecord[]> {
  try {
    const response = await fetch(
      `${GRIST_BASE_URL}/docs/${GRIST_DOC_ID}/tables/${GRIST_TABLE_ID}/records?sort=date`,
      {
        headers: {
          Authorization: `Bearer ${GRIST_API_KEY}`,
          Accept: "application/json",
        },
        method: "GET",
      }
    );
    const data = await response.json();
    return data.records;
  } catch (error) {
    console.error("Error fetching transactions from Grist:", error);
    return [];
  }
}

const createICalendarContent = (events: Event[]) => {
  let icsContent = "BEGIN:VCALENDAR\nVERSION:2.0\n";
  icsContent += "CALSCALE:GREGORIAN\n";
  icsContent += "METHOD:PUBLISH\n";
  icsContent += "PRODID:-//Your Organization//NONSGML Event//EN\n";
  // ------------------------------------------------------------------
  events.forEach((event: Event) => {
    icsContent += "BEGIN:VEVENT\n";
    icsContent += `UID:${event.uid}@calendar\n`;
    icsContent += `DTSTAMP:${formattedUtcDate(new Date())}\n`;
    icsContent += `SEQUENCE:0\n`;
    icsContent += `DTSTART:${event.start}\n`;
    icsContent += `DTEND:${event.end}\n`;
    icsContent += `SUMMARY:${event.summary}\n`;
    icsContent += `DESCRIPTION: Transaction - ${event.description}\n`;
    icsContent += "END:VEVENT\n";
  });
  icsContent += "END:VCALENDAR";

  return icsContent;
};

const formattedUtcDate = (date: Date) => {
  const year = date.getUTCFullYear();
  const month = ("0" + (date.getUTCMonth() + 1)).slice(-2);
  const day = ("0" + date.getUTCDate()).slice(-2);
  return `${year}${month}${day}`;
};

function generateIcalendar(trasactions: GristRecord[]) {
  // define evets data
  const events = trasactions.map((item: GristRecord) => {
    const itemDateTimestamp = item.fields.date;
    
    const startItemDate = new Date(itemDateTimestamp * 1000);
    const endItemDate = new Date(startItemDate);

    return {
      uid: item.id.toString(),
      start: formattedUtcDate(startItemDate),
      end: formattedUtcDate(endItemDate),
      summary: item.fields.description,
      description: `Amount: ${item.fields.amount}`,
    };
  });

  // create iCalendar content
  return createICalendarContent(events);
}

export const GET: APIRoute = async ({ request }) => {
  const now = new Date();
  const todayStart = new Date(now.toISOString().split("T")[0]);
  const twoMonthsLaterEnd = addMonths(todayStart, 2);

  const transactions = await getTransactions();

  const filteredTransactions = transactions.filter((item: GristRecord) => {
    const itemDateTimestamp = new Date(item.fields.date * 1000);
    return (
      itemDateTimestamp >= todayStart && itemDateTimestamp <= twoMonthsLaterEnd
    );
  });

  // Generate iCalendar
  const icsContent = generateIcalendar(filteredTransactions);

  return new Response(icsContent, {
    headers: {
      "Content-Type": "text/calendar",
      "Content-Disposition": `attachment; filename=calendar.ics`,
    },
    status: 200,
    statusText: "OK",
  });
};
