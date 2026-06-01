import 'reflect-metadata';
import * as bcrypt from 'bcryptjs';
import * as fs from 'fs';
import * as mongoose from 'mongoose';
import * as path from 'path';
import { Model } from 'mongoose';
import { User, UserSchema } from './users/schemas/user.schema';

type AdminInput = {
  name: string;
  email: string;
  password: string;
  phone?: string;
};

type AdminArgs = Partial<Record<keyof AdminInput, string>>;

class InputError extends Error {}

const USAGE = `
Uso:
  npm run create:admin -- --email admin@cuidarbem.com --password "SenhaForte123!" --name "Admin CuidarBem"
  npm run create:admin -- admin@cuidarbem.com "SenhaForte123!" "Admin CuidarBem"

Também aceita variáveis de ambiente no PowerShell:
  $env:ADMIN_EMAIL="admin@cuidarbem.com"; $env:ADMIN_PASSWORD="SenhaForte123!"; npm run create:admin

Opções:
  --email, -e       Email do administrador (obrigatório)
  --password, -p    Senha do administrador (obrigatória)
  --name, -n        Nome do administrador (padrão: Administrador CuidarBem)
  --phone           Telefone opcional
`.trim();

const ARG_ALIASES: Record<string, keyof AdminInput> = {
  '--email': 'email',
  '-e': 'email',
  '--password': 'password',
  '-p': 'password',
  '--name': 'name',
  '-n': 'name',
  '--phone': 'phone',
};

function loadEnvFiles() {
  const initialEnvKeys = new Set(Object.keys(process.env));
  const candidates = [
    path.resolve(process.cwd(), '.env'),
    path.resolve(__dirname, '..', '.env'),
  ];

  for (const envPath of Array.from(new Set(candidates))) {
    if (!fs.existsSync(envPath)) {
      continue;
    }

    const content = fs.readFileSync(envPath, 'utf8');
    const parsedEnv: Record<string, string> = {};

    for (const line of content.split(/\r?\n/)) {
      const trimmedLine = line.trim();

      if (!trimmedLine || trimmedLine.startsWith('#')) {
        continue;
      }

      const separatorIndex = trimmedLine.indexOf('=');

      if (separatorIndex === -1) {
        continue;
      }

      const key = trimmedLine.slice(0, separatorIndex).trim();
      let value = trimmedLine.slice(separatorIndex + 1).trim();

      const isQuoted =
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"));

      if (isQuoted) {
        value = value.slice(1, -1);
      }

      parsedEnv[key] = value;
    }

    for (const [key, value] of Object.entries(parsedEnv)) {
      if (!initialEnvKeys.has(key)) {
        process.env[key] = value;
      }
    }
  }
}

function parseArgs(argv: string[]): AdminArgs {
  const parsedArgs: AdminArgs = {};
  const positionalArgs: string[] = [];

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === '--help' || arg === '-h') {
      console.log(USAGE);
      process.exit(0);
    }

    const separatorIndex = arg.indexOf('=');
    const rawKey = separatorIndex === -1 ? arg : arg.slice(0, separatorIndex);
    const inlineValue =
      separatorIndex === -1 ? undefined : arg.slice(separatorIndex + 1);
    const inputKey = ARG_ALIASES[rawKey];

    if (!inputKey) {
      if (!arg.startsWith('-')) {
        positionalArgs.push(arg);
        continue;
      }

      throw new InputError(`Argumento desconhecido: ${arg}`);
    }

    const value = inlineValue ?? argv[index + 1];

    if (!value || (inlineValue === undefined && value.startsWith('-'))) {
      throw new InputError(`Informe um valor para ${rawKey}`);
    }

    if (inlineValue === undefined) {
      index += 1;
    }

    parsedArgs[inputKey] = value;
  }

  if (!parsedArgs.email && positionalArgs[0]) {
    parsedArgs.email = positionalArgs[0];
  }

  if (!parsedArgs.password && positionalArgs[1]) {
    parsedArgs.password = positionalArgs[1];
  }

  if (!parsedArgs.name && positionalArgs[2]) {
    parsedArgs.name = positionalArgs[2];
  }

  if (positionalArgs.length > 3) {
    throw new InputError(
      `Argumentos posicionais extras: ${positionalArgs.slice(3).join(', ')}`,
    );
  }

  return parsedArgs;
}

function resolveInput(): AdminInput {
  const args = parseArgs(process.argv.slice(2));
  const email = (args.email ?? process.env.ADMIN_EMAIL ?? '')
    .trim()
    .toLowerCase();
  const password = args.password ?? process.env.ADMIN_PASSWORD ?? '';
  const name = (args.name ?? process.env.ADMIN_NAME ?? 'Administrador CuidarBem')
    .trim();
  const phone = (args.phone ?? process.env.ADMIN_PHONE)?.trim();

  if (!email) {
    throw new InputError('Informe o email do administrador.');
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new InputError('Informe um email válido.');
  }

  if (!password) {
    throw new InputError('Informe a senha do administrador.');
  }

  if (password.length < 6) {
    throw new InputError('A senha deve ter pelo menos 6 caracteres.');
  }

  if (!name) {
    throw new InputError('Informe o nome do administrador.');
  }

  return {
    name,
    email,
    password,
    ...(phone ? { phone } : {}),
  };
}

function getUserModel(): Model<User> {
  const existingModel = mongoose.models.User as Model<User> | undefined;

  return existingModel || mongoose.model<User>('User', UserSchema);
}

async function upsertAdmin(input: AdminInput) {
  const userModel = getUserModel();
  const hashedPassword = await bcrypt.hash(input.password, 12);
  const existingUser = await userModel.findOne({ email: input.email });

  if (existingUser) {
    existingUser.name = input.name;
    existingUser.password = hashedPassword;
    existingUser.role = 'admin';
    existingUser.isActive = true;
    existingUser.isOnline = false;
    existingUser.moderationStatus = 'active';

    if (input.phone) {
      existingUser.phone = input.phone;
    }

    await existingUser.save();
    console.log(`✅ Administrador atualizado: ${input.email}`);
    return;
  }

  await userModel.create({
    name: input.name,
    email: input.email,
    password: hashedPassword,
    role: 'admin',
    phone: input.phone,
    isActive: true,
    isOnline: false,
    moderationStatus: 'active',
  });

  console.log(`✅ Administrador criado: ${input.email}`);
}

async function main() {
  loadEnvFiles();

  const input = resolveInput();
  const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/cuidar-bem';

  await mongoose.connect(mongoUri);
  await upsertAdmin(input);
  await mongoose.disconnect();
}

main().catch(async (error) => {
  await mongoose.disconnect();

  if (error instanceof InputError) {
    console.error(`❌ ${error.message}`);
    console.error('');
    console.error(USAGE);
    process.exit(1);
  }

  console.error('❌ Não foi possível criar o administrador.');
  console.error(error);
  process.exit(1);
});
