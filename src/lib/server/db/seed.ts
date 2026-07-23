import 'dotenv/config';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { reflections, pages, themes } from './schema';

const url = process.env.DATABASE_URL;
if (!url) throw new Error('DATABASE_URL is not set');

const client = postgres(url);
const db = drizzle(client);

// Exported from the production database on 2026-07-14. Content-only snapshot
// (reflections, pages, themes) — operator accounts, sessions, and push
// subscriptions are intentionally omitted (create an admin with
// `npm run admin:create` in the new environment). Regenerate this file by
// re-exporting the same three tables; see drizzle/seed-data.sql for the raw
// SQL equivalent.

const reflectionSeed = [
  {
    sections: [
      'We are with ourselves here in the dark, Father, aware of our vulnerabilities, our needs and mortal limitations.\n' +
        '\n' +
        '\n' +
        '\n' +
        'All we have done today is now left to rest in You, or grow in You, depending on Your will. We have done all we could, yet perhaps not all we should, we trust You now as always, God, with both.'
    ],
    source: 'Prayer Vol. 02',
    attribution: 'Strahan Coleman',
    copyright: '© Strahan Coleman. Used with permission.',
    isPublished: true
  },
  {
    sections: [
      'God, give me grace to accept with serenity the things that cannot be changed, courage to change the things which should be changed, and the wisdom to distinguish the one from the other.\n' +
        '\n' +
        '\n' +
        '\n' +
        'Living one day at a time,\n' +
        'enjoying one moment at a time.\n' +
        '\n' +
        'Accepting hardships as the pathway to peace. Taking, as he did, the sinful world as it is, not as I would have it.\n' +
        '\n' +
        'Trusting that he will make all things right\n' +
        'if I surrender to His will; that I may be reasonably happy in this life,\n' +
        'and supremely happy with Him forever.'
    ],
    source: null,
    attribution: 'Reinhold Niebuhr',
    copyright: 'Public domain',
    isPublished: true
  },
  {
    sections: [
      'You have made us for yourself, O Lord, and our hearts are restless until they rest in You.'
    ],
    source: 'Confessions',
    attribution: 'St. Augustine of Hippo',
    copyright: 'Public Domain',
    isPublished: true
  },
  {
    sections: [
      "I'm learning to discover You, in the minute and ordinary, God. Your kingdom is as miniature as it is vast.\n" +
        '\n' +
        '\n' +
        '\n' +
        '\n' +
        "May you have the courage to live a small life - a life that gives up on the hope of grandeur for the quiet knowing that, in God's economy, less is more.",
      "-# Our culture tends to put its faith in a liturgy of grandeur____It's as if there is an invisible magnet in the centre of Western life drawing us all invisibly into the false hope of rising up in the strength of our own particular dream or talent to become the individual hero of a grandiose story____The kingdom of heaven is painfully ordinary by comparison____God lives just as much (if not more) in the microscopic - the atom, the unseen breath, the quiet laws of gravity - as He does in the grand____A secret act of kindness, generosity or compassion is God's version of a 'successful career', and in His economy, kingdom heroes often remain anonymous to the self-oriented majority____Father, teach me that kind of humility, and help me to be - and to remain - your poor-in-spirit one."
    ],
    source: 'Prayer Vol. 02',
    attribution: 'Strahan Coleman',
    copyright: '© Strahan Coleman. Used with permission.',
    isPublished: true
  },
  {
    sections: [
      'Untame my love.',
      '-# Make my love outrageous, shocking, vulnerable, daring, other seeking, self emptying and long suffering. Make it undeniable, weakness-embracing, fear overcoming and hurt braving. Make it willing and humble, patient and subtle, quiet yet controversial.\n' +
        '\n' +
        '-# Make my love a home for the pushed down, the unseen and the trampled-over. Make it hungry and thirsty, then filled to overflowing, always seeking yet never knowing. Make me a person of that kind of love, known for that love, unsatisfied by falling short of that love. Make me a person after Your love, Father, and let that be enough for me.'
    ],
    source: 'Prayer Vol. 02',
    attribution: 'Strahan Coleman',
    copyright: '© Strahan Coleman. Used with permission.',
    isPublished: true
  },
  {
    sections: [
      'What comes into our minds when we think about God is the most important thing about us.\n' +
        '\n' +
        '\n' +
        '\n' +
        'The second is what comes to mind when we think of ourselves.',
      '-# The creator of the cosmos is not an abstract force, or a disconnected deity. He is a person three____Father, Son, Spirit. A relational community of love that perpetually supplies all that is needed for their enjoyment____We have been created in the likeness of this beautiful community, with the same needs that are only met in our creator. You are fearfully and wonderfully made, by a community of loving kindness and selfless generosity____May your heart be open to respond to your reality.'
    ],
    source: 'The Knowledge of the Holy',
    attribution: 'A.W Tozer / Jeremy Prowse',
    copyright: '© 1900; A Publisher...',
    isPublished: true
  },
  {
    sections: [
      'Have you been asking God what He is going to do? He will never tell you. God does not tell you what He is going to do; He reveals to you Who He is.'
    ],
    source: 'My Utmost for His Highest',
    attribution: 'Oswald Chambers',
    copyright: 'Public Domain',
    isPublished: true
  },
  {
    sections: [
      'Has it ever occurred to you that one hundred pianos all tuned to the same fork are automatically tuned to each other? They are of one accord by being tuned, not to each other, but to another standard to which each one must individually bow.\n' +
        "So one hundred worshipers met together, each one looking away to Christ, are in heart nearer to each other than they could possibly be, were they to become 'unity' conscious and turn their eyes away from God to strive for closer fellowship."
    ],
    source: 'The Pursuit of God',
    attribution: 'A.W. Tozer',
    copyright: '© 1900; A Publisher...',
    isPublished: true
  },
  {
    sections: [
      'Some day you will be old enough to start reading fairy tales again.',
      '-# Somewhere along the way, we got "sensible". We put dreaming, imagining, believing behind us and settled for rationalism____The One who strew the stars across the galaxies has never ceased to dream though. He spends eternity imagining new wonderful ways to express his creativity and love to his creation____Father, free us from our sensibilities, take us back to a simple way, a child-like way, that trusts, dreams, and imagines beyond the reality our senses have caged us in.\n' +
        '\n' +
        '-# - Jeremy Prowse'
    ],
    source: null,
    attribution: 'C.S. Lewis',
    copyright: null,
    isPublished: true
  }
];

const pageSeed = [
  {
    uri: 'about',
    content:
      'In the middle of a loud and fast-paced world, we invite you to slow down, and take some space. So pause, and align with the divine presence that longs to connect with you.\n' +
      '\n' +
      'What you will be invited to reflect on are prayers and reflections from faithful, dedicated lovers of God, who have a deep heart for this world to discover more of Him.\n' +
      '\n' +
      '## Definition;\n' +
      '\n' +
      'Ruakh\n' +
      '\n' +
      '-# noun; verb;\n' +
      '\n' +
      '"Breath," "wind," or "spirit." It is the invisible, powerful force that brings life, movement, and divine presence into the world. It is the very breath of God that sustains us.'
  }
];

const themeSeed = [
  { name: 'Sunset', bg: '#f7a31a', accent: '#f5350b', ink: '#000000', sort: 0 },
  { name: 'Coral', bg: '#571df7', accent: '#e2187a', ink: '#f5fafa', sort: 0 },
  { name: 'Forest', bg: '#261703', accent: '#134931', ink: '#eff5f2', sort: 0 },
  { name: 'Flash', bg: '#f1eee4', accent: '#ffffff', ink: '#1d1c1b', sort: 0 },
  { name: 'Ocean', bg: '#113757', accent: '#276d8b', ink: '#ffffff', sort: 1 },
  { name: 'Midnight', bg: '#1f1f1f', accent: '#292929', ink: '#ffffff', sort: 2 }
];

async function main() {
  // Reflections have no natural unique key, so guard against re-runs duplicating them.
  const existing = await db.select({ id: reflections.id }).from(reflections).limit(1);
  if (existing.length > 0) {
    console.log('Reflections already present — skipping reflection seed.');
  } else {
    await db.insert(reflections).values(reflectionSeed);
  }

  // uri is the primary key; refresh content so this snapshot wins over the
  // placeholder 'about' page created by migration 0003.
  for (const page of pageSeed) {
    await db
      .insert(pages)
      .values(page)
      .onConflictDoUpdate({ target: pages.uri, set: { content: page.content } });
  }

  // Migration 0003 pre-seeds the three base themes, so insert only the ones
  // that aren't already present (by name) rather than skipping wholesale —
  // otherwise the later-added themes would be missing in a fresh environment.
  const existingThemeNames = new Set(
    (await db.select({ name: themes.name }).from(themes)).map((t) => t.name)
  );
  const missingThemes = themeSeed.filter((t) => !existingThemeNames.has(t.name));
  if (missingThemes.length === 0) {
    console.log('All themes already present — skipping theme seed.');
  } else {
    await db.insert(themes).values(missingThemes);
  }

  await client.end();
  console.log('Seed complete.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
