import { MongoClient } from 'mongodb';
import { readFileSync } from 'fs';

const env = Object.fromEntries(
  readFileSync('.env', 'utf8').split('\n')
    .filter(l => l.includes('='))
    .map(l => [l.split('=')[0].trim(), l.slice(l.indexOf('=')+1).trim()])
);

const client = await new MongoClient(env.MONGODB_URI).connect();
const db = client.db(env.MONGODB_DB);

const links = await db.collection('oauth_google_links').find().toArray();
console.log('Google links:', JSON.stringify(links, null, 2));

const profilesWithGames = await db.collection('game_results').distinct('localProfileId');
console.log('Profile IDs with games:', profilesWithGames);

for (const pid of profilesWithGames) {
  const count = await db.collection('game_results').countDocuments({ localProfileId: pid });
  console.log(' ', pid, '→', count, 'games');
}

await client.close();
