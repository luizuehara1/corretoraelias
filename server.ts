import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Initialize Gemini client with User-Agent for telemetry
  const api_key = process.env.GEMINI_API_KEY;
  const ai = api_key ? new GoogleGenAI({
    apiKey: api_key,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  }) : null;

  // 1. API: HEALTH CHECK
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", ai_status: !(!api_key) });
  });

  // 2. API: GENERATE TEXTS
  app.post("/api/gemini/generate", async (req, res) => {
    try {
      if (!ai) {
        return res.status(500).json({ error: "A chave de API do Gemini não está configurada no ambiente." });
      }

      const { imovel } = req.body;
      if (!imovel) {
        return res.status(400).json({ error: "Dados do imóvel são obrigatórios." });
      }

      // Format property characteristics and arrays for prompt
      const caracStr = Array.isArray(imovel.caracteristicas) ? imovel.caracteristicas.join(", ") : "";
      const ambStr = Array.isArray(imovel.ambientes) ? imovel.ambientes.join(", ") : "";
      const proxStr = Array.isArray(imovel.proximidades) ? imovel.proximidades.join(", ") : "";
      const lazStr = Array.isArray(imovel.lazer) ? imovel.lazer.join(", ") : "";
      const acabStr = Array.isArray(imovel.acabamentos) ? imovel.acabamentos.join(", ") : "";
      const instStr = Array.isArray(imovel.instalacoes) ? imovel.instalacoes.join(", ") : "";

      // Construct rich context prompt following constraints strictly.
      const prompt = `
Tarefa: Você é uma Inteligência Artificial especialista em copy de alto padrão para imóveis em Sorocaba. Seu trabalho é gerar textos persuasivos, elegantes e informativos para o anúncio de um imóvel da imobiliária "RB Sorocaba Negócios Imobiliários".

IMPORTANTE: Você deve respeitar rigidamente estas regras:
1. NUNCA mencione o nome "Menta". A imobiliária é "RB Sorocaba Negócios Imobiliários".
2. NÃO INVENTE NENHUMA INFORMAÇÃO que não esteja fornecida nos dados do imóvel abaixo. Se não houver suíte, não fale suíte. Se não houver condomínio, não cite condomínio. Se não houver quantidade de vagas, não cite vagas. Seja estritamente literal nos recursos.

Dados do Imóvel:
- Tipo: ${imovel.type || imovel.tipoImovel || "Imóvel"}
- Categoria: ${imovel.category || ""}
- Finalidade: ${imovel.purpose || imovel.tipoNegocio || "Venda"}
- Cidade: ${imovel.cidade || imovel.city || "Sorocaba"}
- Bairro: ${imovel.bairro || imovel.neighborhood || ""}
- Endereço: ${imovel.endereco || imovel.location || ""} (Apenas usar endereço se fornecido!)
- Quartos: ${imovel.beds || ""}
- Suítes: ${imovel.suites || ""}
- Banheiros: ${imovel.baths || ""}
- Vagas de Garagem: ${imovel.parkingCovered || ""}
- Área Útil: ${imovel.areaUseful || imovel.area || ""}
- Área Total: ${imovel.areaTotal || ""}
- Valor de Venda: ${imovel.valorVenda ? "R$ " + imovel.valorVenda : ""}
- Valor de Aluguel/Locação: ${imovel.valorAluguel ? "R$ " + imovel.valorAluguel : ""}
- Valor do Condomínio: ${imovel.valorCondominio ? "R$ " + imovel.valorCondominio : ""}
- IPTU anual: ${imovel.valorIptuAnual ? "R$ " + imovel.valorIptuAnual : ""}
- Características: ${caracStr}
- Ambientes: ${ambStr}
- Lazer: ${lazStr}
- Acabamento: ${acabStr}
- Instalações: ${instStr}
- Proximidades: ${proxStr}
- Descrição manual prévia (se houver): ${imovel.description || imovel.descricao || ""}
- Aceita financiamento bancário: ${imovel.aceitaFinanciamento ? "Sim" : "Não"}
- Aceita permuta: ${imovel.aceitaPermuta ? "Sim" : "Não"}
- Aceita FGTS: ${imovel.aceitaFGTS ? "Sim" : "Não"}
- Mobiliado: ${imovel.eMobiliado || imovel.mobiliado ? "Sim" : "Não"}
- Imóvel alugado atualmente: ${imovel.imovelAlugado ? "Sim" : "Não"}

Com base nestes dados exatos, gere as seguintes informações em português do Brasil:

A) tituloAnuncio:
- Deve ser chamativo e seguir o formato: "[Tipo de Imóvel] à venda/para locação no [Bairro] de [Cidade]".
Exemplo: 'Apartamento à venda no Centro de Sorocaba' ou 'Casa com 3 dormitórios no Jardim Europa'.

B) subtituloAnuncio:
- Uma chamada curta e elegante. Exemplo: 'Conforto, localização estratégica e excelente oportunidade para morar ou investir.'

C) descricaoCurta:
- Texto resumido de 2 a 4 linhas, ideal para os cards e listagens de imóveis no site.

D) descricaoDetalhada:
- Um texto completo, profissional e elegante, realçando a localização, estrutura do imóvel, cômodos, diferenciais e as condições comerciais (financiamento, permuta, FGTS, etc. se preenchidos). Use parágrafos limpos para leitura.

E) diferenciaisAnuncio:
- Lista em tópicos simples (separados por quebras de linha com traço "-") dos principais diferenciais ou pontos fortes que foram explicitamente fornecidos.

F) textoWhatsapp:
- Texto curto, direto, com tópicos e espaçamentos elegantes para enviar ao cliente pelo WhatsApp para capturar a atenção de forma profissional.

G) textoInstagram:
- Texto cativante, comercial, com hashtags interessantes e um bom Call To Action (CTA) direcionado à RB Sorocaba para o Instagram ou Reels.

H) tituloSEO:
- Título focado em SEO para o Google. Exemplo: 'Apartamento à venda no Centro de Sorocaba | RB Sorocaba'.

I) descricaoSEO:
- Descrição meta com menos de 160 caracteres, ideal para busca de SEO, englobando bairro, cidade e tipo.

J) palavrasChaveSEO:
- Lista de palavras-chave separadas por vírgula. Ex: '[tipo] em Sorocaba, comprar [tipo] [bairro] Sorocaba, imovel a venda em Sorocaba'.
`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              tituloAnuncio: { type: Type.STRING },
              subtituloAnuncio: { type: Type.STRING },
              descricaoCurta: { type: Type.STRING },
              descricaoDetalhada: { type: Type.STRING },
              diferenciaisAnuncio: { type: Type.STRING },
              textoWhatsapp: { type: Type.STRING },
              textoInstagram: { type: Type.STRING },
              tituloSEO: { type: Type.STRING },
              descricaoSEO: { type: Type.STRING },
              palavrasChaveSEO: { type: Type.STRING }
            },
            required: [
              "tituloAnuncio",
              "subtituloAnuncio",
              "descricaoCurta",
              "descricaoDetalhada",
              "diferenciaisAnuncio",
              "textoWhatsapp",
              "textoInstagram",
              "tituloSEO",
              "descricaoSEO",
              "palavrasChaveSEO"
            ]
          }
        }
      });

      const text = response.text;
      if (!text) {
        throw new Error("Resposta vazia do Gemini.");
      }

      const result = JSON.parse(text);
      res.json(result);
    } catch (error: any) {
      console.error("Gemini Generate Error:", error);
      res.status(500).json({ error: error?.message || "Erro ao gerar textos." });
    }
  });

  // 3. API: IMPROVE DESCRIPTION OR OTHER MULTIPURPOSE IMPROVEMENTS
  app.post("/api/gemini/improve", async (req, res) => {
    try {
      if (!ai) {
        return res.status(500).json({ error: "A chave de API do Gemini não está configurada no ambiente." });
      }

      const { text, context } = req.body;
      if (!text) {
        return res.status(400).json({ error: "O texto para melhorar é obrigatório." });
      }

      const prompt = `
Você é um copyspecalist e corretor sênior da imobiliária premium "RB Sorocaba Negócios Imobiliários".
Reescreva e melhore a descrição do imóvel de forma muito mais profissional, atraente, sofisticada e focado na conversão de leads.

Regras fundamentais:
- Preserve todos os dados numéricos de metragens, valores, quartos e facilidades exatas do contexto.
- NUNCA invente facilidades que não estão presentes no texto ou no contexto.
- NUNCA use o nome "Menta". O nome correto é "RB Sorocaba Negócios Imobiliários".
- Deixe o texto excelente para leitura com parágrafos bem espaçados.

Texto original:
"${text}"

Contexto adicional do imóvel (se houver):
${context ? JSON.stringify(context) : "Nenhum fornecido"}

Gere apenas o texto melhorado pronto para uso, sem comentários introdutórios ou finais.
`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt
      });

      res.json({ improvedText: response.text });
    } catch (error: any) {
      console.error("Gemini Improve Error:", error);
      res.status(500).json({ error: error?.message || "Falha ao melhorar texto." });
    }
  });

  // Vite middleware setup for Development/Production separation
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    
    app.use('*', async (req, res, next) => {
      if (req.originalUrl.startsWith('/api')) {
        return next();
      }
      try {
        const url = req.originalUrl;
        let template = fs.readFileSync(path.resolve(process.cwd(), 'index.html'), 'utf-8');
        template = await vite.transformIndexHtml(url, template);
        res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
      } catch (e) {
        if (vite) vite.ssrFixStacktrace(e as Error);
        next(e);
      }
    });
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.use('*', (req, res) => {
      if (req.originalUrl.startsWith('/api')) {
        return res.status(404).json({ error: "API Endpoint não encontrado" });
      }
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
