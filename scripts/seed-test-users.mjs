import { createClient } from "@supabase/supabase-js";

const expectedConfirmation = "I_UNDERSTAND_THIS_IS_NOT_PRODUCTION";
const studentFixtures = [
  {
    full_name: "Aanya Rao",
    major: "CSE",
    grad_year: 2027,
    bio: "[TEST PROFILE] Has a playlist for every coding sprint.",
    status: "single",
    hobbies: ["Coding", "Photography", "Indie Music"],
    relationship_vibes: ["Long Term / Serious", "Dating & Outings"],
    contact_handle: "campuskin_test_aanya",
    birth_date: "2003-04-12",
  },
  {
    full_name: "Kiran Reddy",
    major: "ECE",
    grad_year: 2026,
    bio: "[TEST PROFILE] Matcha, music and one more lap around the track.",
    status: "open_to_see",
    hobbies: ["Sports", "Indie Music", "Gaming"],
    relationship_vibes: ["Study Buddy & Chill", "Friends First / Platonic"],
    contact_handle: "campuskin_test_kiran",
    birth_date: "2002-08-19",
  },
  {
    full_name: "Tara Nair",
    major: "MBA",
    grad_year: 2028,
    bio: "[TEST PROFILE] Cafe scout and enthusiastic dessert reviewer.",
    status: "single",
    hobbies: ["Chai & Maggi", "Binge Watching", "Photography"],
    relationship_vibes: ["Cuffing Season", "Dating & Outings"],
    contact_handle: "campuskin_test_tara",
    birth_date: "2004-02-06",
  },
  {
    full_name: "Arjun Shah",
    major: "IT",
    grad_year: 2027,
    bio: "[TEST PROFILE] Here for a co-op game and a good conversation.",
    status: "it_is_complicated",
    hobbies: ["Gaming", "Anime", "Coding"],
    relationship_vibes: ["Situationship", "Friends First / Platonic"],
    contact_handle: "campuskin_test_arjun",
    birth_date: "2003-11-25",
  },
  {
    full_name: "Sia Thomas",
    major: "MCA",
    grad_year: 2029,
    bio: "[TEST PROFILE] Library regular, chai break loyalist.",
    status: "single",
    hobbies: ["Hackathons", "Chai & Maggi", "Anime"],
    relationship_vibes: ["Study Buddy & Chill", "Long Term / Serious"],
    contact_handle: "campuskin_test_sia",
    birth_date: "2004-09-03",
  },
  {
    full_name: "Dev Patil",
    major: "Mech",
    grad_year: 2026,
    bio: "[TEST PROFILE] Weekend badminton, weekday Maggi.",
    status: "open_to_see",
    hobbies: ["Sports", "Gym/Fitness", "Chai & Maggi"],
    relationship_vibes: ["Benching / Roster Dating", "Dating & Outings"],
    contact_handle: "campuskin_test_dev",
    birth_date: "2002-05-17",
  },
];

function required(name) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Missing ${name} in .env.local.`);
  return value;
}

async function listAllUsers(admin) {
  const users = [];
  const perPage = 1000;
  for (let page = 1; page <= 100; page += 1) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage });
    if (error) throw new Error(`Could not inspect existing test users: ${error.message}`);
    users.push(...data.users);
    if (data.users.length < perPage) return users;
  }
  throw new Error("Stopped before seeding because the user list exceeded the safety limit.");
}

function readSeedConfig() {
  if (process.env.ALLOW_TEST_SEED !== expectedConfirmation) {
    throw new Error(`Seeding blocked. Set ALLOW_TEST_SEED=${expectedConfirmation} only for a dedicated test project.`);
  }
  const url = new URL(required("NEXT_PUBLIC_SUPABASE_URL"));
  const projectRef = required("CAMPUSKIN_TEST_PROJECT_REF");
  if (!/^[a-z0-9]{20}$/.test(projectRef) || url.hostname !== `${projectRef}.supabase.co`) {
    throw new Error("The Supabase URL must exactly match CAMPUSKIN_TEST_PROJECT_REF. Use a dedicated test project, never production.");
  }
  const serviceKey = required("SUPABASE_SERVICE_ROLE_KEY");
  const password = required("CAMPUSKIN_TEST_PASSWORD");
  if (password.length < 12) throw new Error("CAMPUSKIN_TEST_PASSWORD must be at least 12 characters.");
  return { url, projectRef, serviceKey, password };
}

function createTestAccounts(projectRef) {
  const prefix = `campuskin.test.${projectRef}`;
  return [
    {
      label: "Admin test login",
      email: `${prefix}.admin@siddhartha.co.in`,
      fixture: {
        full_name: "Campus QA Admin [TEST]",
        major: "CSE",
        grad_year: 2026,
        bio: "[TEST PROFILE] QA login for checking the test project. This is not an admin role.",
        status: "single",
        hobbies: ["Coding", "Gaming"],
        relationship_vibes: ["Study Buddy & Chill", "Friends First / Platonic"],
        contact_handle: "campuskin_test_admin",
        birth_date: "2001-01-01",
      },
    },
    ...studentFixtures.map((fixture, index) => ({
      label: `Student ${index + 1}`,
      email: `${prefix}.student${String(index + 1).padStart(2, "0")}@siddhartha.co.in`,
      fixture,
    })),
  ];
}

function assertSafeTestUsers(accounts, existingByEmail, projectRef) {
  const collision = accounts.find(({ email }) => {
    const existing = existingByEmail.get(email);
    return existing && existing.app_metadata?.campuskin_seed_project_ref !== projectRef;
  });
  if (collision) {
    throw new Error(`Refusing to reuse ${collision.email}: it is not already marked as a Campus Kin test account in this project.`);
  }
}

async function ensureTestUser(admin, account, existing, password, projectRef) {
  if (existing) {
    const { data, error } = await admin.auth.admin.updateUserById(existing.id, { password, email_confirm: true });
    if (error) throw new Error(`Could not refresh seeded account ${account.email}: ${error.message}`);
    return data.user;
  }

  const { data, error } = await admin.auth.admin.createUser({
    email: account.email,
    password,
    email_confirm: true,
    app_metadata: { campuskin_seed_project_ref: projectRef, campuskin_test_account: true },
    user_metadata: { birth_date: account.fixture.birth_date },
  });
  if (error) throw new Error(`Could not create test account ${account.email}: ${error.message}`);
  return data.user;
}

async function prepareProfiles(admin, accounts, existingByEmail, password, projectRef) {
  return Promise.all(accounts.map(async (account) => {
    const existing = existingByEmail.get(account.email);
    const user = await ensureTestUser(admin, account, existing, password, projectRef);
    return {
      account,
      user,
      profile: {
        id: user.id,
        email: account.email,
        avatar_url: `https://api.dicebear.com/9.x/notionists/svg?seed=${encodeURIComponent(account.fixture.full_name)}`,
        contact_type: "instagram",
        ...account.fixture,
      },
    };
  }));
}

async function main() {
  const { url, projectRef, serviceKey, password } = readSeedConfig();
  const admin = createClient(url.origin, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });
  const accounts = createTestAccounts(projectRef);
  const existingUsers = await listAllUsers(admin);
  const existingByEmail = new Map(existingUsers.map((user) => [user.email?.toLowerCase(), user]));
  assertSafeTestUsers(accounts, existingByEmail, projectRef);

  const prepared = await prepareProfiles(admin, accounts, existingByEmail, password, projectRef);
  const { error } = await admin.from("profiles").upsert(prepared.map(({ profile }) => profile), { onConflict: "id" });
  if (error) throw new Error(`Auth accounts were prepared, but profiles were not seeded: ${error.message}. Rerun after resolving this database error.`);

  prepared.forEach(({ account, user }) => console.log(`${account.label}: ${account.email} (user id ${user.id})`));
  console.log(`Seeded ${prepared.length} clearly labeled test profiles in project ${projectRef}.`);
  console.log("All accounts use CAMPUSKIN_TEST_PASSWORD from .env.test.local. No credentials were printed.");
}

try {
  await main();
} catch (error) {
  console.error(error instanceof Error ? error.message : "Test seeding failed.");
  process.exitCode = 1;
}
