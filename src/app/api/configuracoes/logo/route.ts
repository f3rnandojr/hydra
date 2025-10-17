import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { writeFile, rm, stat, mkdir } from 'fs/promises';
import path from 'path';

const LOGO_CONFIG_KEY = "logo_sistema";
const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads');

async function ensureUploadDirExists() {
  try {
    await stat(UPLOAD_DIR);
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      await mkdir(UPLOAD_DIR, { recursive: true });
    } else {
      throw error;
    }
  }
}

// GET /api/configuracoes/logo
export async function GET(request: NextRequest) {
  try {
    const client = await clientPromise;
    const db = client.db("hydra");
    
    const logoConfig = await db.collection("configuracoes").findOne({ chave: LOGO_CONFIG_KEY });

    if (!logoConfig) {
      return NextResponse.json({ url: "/logo.svg" }); // Retorna logo padrão
    }

    return NextResponse.json(logoConfig.valor);
  } catch (error) {
    console.error("Erro ao buscar logo:", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}

// POST /api/configuracoes/logo
export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const usuarioId = authHeader?.split(' ')[1];

  if (!usuarioId) {
    return NextResponse.json({ error: "Usuário não autenticado" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get('logo') as File | null;

    if (!file) {
      return NextResponse.json({ error: "Nenhum arquivo enviado" }, { status: 400 });
    }

    // Validações
    const allowedTypes = ['image/png', 'image/jpeg', 'image/svg+xml', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: `Tipo de arquivo não permitido: ${file.type}` }, { status: 400 });
    }
    const maxSize = 2 * 1024 * 1024; // 2MB
    if (file.size > maxSize) {
      return NextResponse.json({ error: "Arquivo muito grande (máximo 2MB)" }, { status: 400 });
    }

    await ensureUploadDirExists();

    const client = await clientPromise;
    const db = client.db("hydra");

    // Remove logo antiga se existir
    const oldConfig = await db.collection("configuracoes").findOne({ chave: LOGO_CONFIG_KEY });
    if (oldConfig && oldConfig.valor.caminhoFisico) {
      try {
        await rm(oldConfig.valor.caminhoFisico);
      } catch (rmError) {
        console.warn("Não foi possível remover o arquivo de logo antigo:", rmError);
      }
    }
    
    // Salvar novo arquivo
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    const fileExtension = path.extname(file.name);
    const fileName = `logo${fileExtension}`;
    const filePath = path.join(UPLOAD_DIR, fileName);
    
    await writeFile(filePath, buffer);

    const logoData = {
      url: `/uploads/${fileName}`,
      nomeArquivo: fileName,
      caminhoFisico: filePath,
      tamanho: file.size,
      tipoMime: file.type,
      dataUpload: new Date(),
      usuarioUploadId: new ObjectId(usuarioId)
    };

    await db.collection("configuracoes").updateOne(
      { chave: LOGO_CONFIG_KEY },
      { 
        $set: { 
          valor: logoData,
          dataAtualizacao: new Date()
        },
        $setOnInsert: {
          tipo: "aparencia",
          chave: LOGO_CONFIG_KEY,
          dataCriacao: new Date()
        }
      },
      { upsert: true }
    );
    
    return NextResponse.json({ message: "Logo atualizada com sucesso!", logo: logoData });

  } catch (error) {
    console.error("Erro no upload da logo:", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}

// DELETE /api/configuracoes/logo
export async function DELETE(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const usuarioId = authHeader?.split(' ')[1];

  if (!usuarioId) {
    return NextResponse.json({ error: "Usuário não autenticado" }, { status: 401 });
  }

  try {
    const client = await clientPromise;
    const db = client.db("hydra");
    
    const oldConfig = await db.collection("configuracoes").findOne({ chave: LOGO_CONFIG_KEY });
    if (oldConfig && oldConfig.valor.caminhoFisico) {
      try {
        await rm(oldConfig.valor.caminhoFisico);
      } catch (rmError) {
        console.warn("Não foi possível remover o arquivo de logo antigo:", rmError);
      }
    }

    const result = await db.collection("configuracoes").deleteOne({ chave: LOGO_CONFIG_KEY });

    if (result.deletedCount === 0) {
      return NextResponse.json({ message: "Nenhuma logo customizada para remover." });
    }

    return NextResponse.json({ message: "Logo restaurada para o padrão com sucesso." });
  } catch (error) {
    console.error("Erro ao remover logo:", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}
