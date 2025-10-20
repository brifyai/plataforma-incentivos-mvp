/**
 * Servicio RAG (Retrieval-Augmented Generation)
 *
 * Proporciona funcionalidades para:
 * - Vectorización de documentos usando embeddings de múltiples proveedores
 * - Búsqueda semántica en la base de conocimiento
 * - Gestión de chunks y embeddings
 * - Caché de búsquedas para mejorar rendimiento
 */

import { supabase } from '../config/supabase';

class RAGService {
  constructor() {
    this.defaultChunkSize = 1000;
    this.defaultChunkOverlap = 200;
    this.maxRetries = 3;
    this.retryDelay = 1000;
    
    // Configuración de proveedores RAG
    this.ragProviders = {
      openai: {
        name: 'OpenAI',
        embeddingModel: 'text-embedding-ada-002',
        baseUrl: 'https://api.openai.com/v1',
        dimensions: 1536
      },
      groq: {
        name: 'Groq',
        embeddingModel: 'text-embedding-ada-002', // Groq usa el mismo modelo de OpenAI para embeddings
        baseUrl: 'https://api.groq.com/openai/v1',
        dimensions: 1536
      },
      chutes: {
        name: 'Chutes',
        embeddingModel: 'text-embedding-ada-002', // Chutes usa el mismo modelo de OpenAI para embeddings
        baseUrl: 'https://api.chutes.ai/v1',
        dimensions: 1536
      }
    };
  }

  /**
   * Divide un texto en chunks con overlap para mejor contexto
   */
  chunkText(text, chunkSize = this.defaultChunkSize, overlap = this.defaultChunkOverlap) {
    if (!text || text.length <= chunkSize) {
      return [text];
    }

    const chunks = [];
    let start = 0;

    while (start < text.length) {
      let end = start + chunkSize;
      
      // Si no es el último chunk, intentar cortar en un punto lógico
      if (end < text.length) {
        // Buscar el último punto, salto de línea o espacio
        const lastPeriod = text.lastIndexOf('.', end);
        const lastNewline = text.lastIndexOf('\n', end);
        const lastSpace = text.lastIndexOf(' ', end);
        
        const cutPoint = Math.max(lastPeriod, lastNewline, lastSpace);
        
        if (cutPoint > start) {
          end = cutPoint + 1;
        }
      }
      
      const chunk = text.substring(start, end).trim();
      if (chunk) {
        chunks.push(chunk);
      }
      
      start = Math.max(start + 1, end - overlap);
    }

    return chunks;
  }

  /**
   * Genera embeddings para un texto usando el proveedor especificado
   */
  async generateEmbedding(text, provider = 'openai', apiKey, retryCount = 0) {
    try {
      const providerConfig = this.ragProviders[provider];
      if (!providerConfig) {
        throw new Error(`Proveedor RAG no soportado: ${provider}`);
      }

      // Determinar la API key según el proveedor
      let effectiveApiKey = apiKey;
      if (!effectiveApiKey) {
        effectiveApiKey = this.getProviderApiKey(provider);
      }

      if (!effectiveApiKey) {
        throw new Error(`API key no configurada para proveedor: ${provider}`);
      }

      const response = await fetch(`${providerConfig.baseUrl}/embeddings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${effectiveApiKey}`
        },
        body: JSON.stringify({
          input: text,
          model: providerConfig.embeddingModel
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`${providerConfig.name} API error: ${error.error?.message || response.statusText}`);
      }

      const data = await response.json();
      return data.data[0].embedding;

    } catch (error) {
      console.error(`Error generating embedding with ${provider} (attempt ${retryCount + 1}):`, error);
      
      // Reintentar si es un error temporal
      if (retryCount < this.maxRetries && this.isRetryableError(error)) {
        await this.delay(this.retryDelay * Math.pow(2, retryCount));
        return this.generateEmbedding(text, provider, apiKey, retryCount + 1);
      }
      
      throw error;
    }
  }

  /**
   * Obtiene la API key para un proveedor específico
   */
  getProviderApiKey(provider) {
    switch (provider) {
      case 'openai':
        return process.env.VITE_OPENAI_API_KEY;
      case 'groq':
        return process.env.VITE_GROQ_API_KEY;
      case 'chutes':
        return process.env.VITE_CHUTES_API_KEY;
      default:
        return null;
    }
  }

  /**
   * Obtiene los proveedores RAG disponibles
   */
  getAvailableRAGProviders() {
    return Object.keys(this.ragProviders).map(key => ({
      id: key,
      name: this.ragProviders[key].name,
      embeddingModel: this.ragProviders[key].embeddingModel,
      dimensions: this.ragProviders[key].dimensions,
      hasApiKey: !!this.getProviderApiKey(key)
    }));
  }

  /**
   * Verifica si un error es reintentable
   */
  isRetryableError(error) {
    const retryablePatterns = [
      /rate limit/i,
      /timeout/i,
      /connection/i,
      /network/i,
      /temporary/i
    ];
    
    return retryablePatterns.some(pattern => pattern.test(error.message));
  }

  /**
   * Función de delay para reintentos
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Procesa un documento completo: chunking + embeddings
   */
  async processDocument(document, ragConfig = {}) {
    const startTime = Date.now();
    const {
      chunkSize = this.defaultChunkSize,
      chunkOverlap = this.defaultChunkOverlap,
      provider = 'openai',
      apiKey = null,
      embeddingModel = 'text-embedding-ada-002',
      similarityThreshold = 0.7,
      maxResults = 10
    } = ragConfig;

    const providerConfig = this.ragProviders[provider];
    if (!providerConfig) {
      throw new Error(`Proveedor RAG no soportado: ${provider}`);
    }

    try {
      // 1. Crear registro de trabajo de procesamiento
      const { data: job, error: jobError } = await supabase
        .from('rag_processing_jobs')
        .insert({
          document_id: document.id,
          corporate_client_id: document.corporate_client_id,
          company_id: document.company_id,
          job_status: 'processing',
          job_type: 'process',
          chunk_size: chunkSize,
          chunk_overlap: chunkOverlap,
          embedding_model: embeddingModel || providerConfig.embeddingModel,
          rag_provider: provider,
          started_at: new Date().toISOString()
        })
        .select()
        .single();

      if (jobError) throw jobError;

      // 2. Dividir el documento en chunks
      const chunks = this.chunkText(document.content, chunkSize, chunkOverlap);
      
      // 3. Generar embeddings para cada chunk
      const embeddings = [];
      let processedChunks = 0;
      let failedChunks = 0;

      for (let i = 0; i < chunks.length; i++) {
        try {
          const embedding = await this.generateEmbedding(chunks[i], provider, apiKey);
          
          // Guardar embedding en la base de datos
          const { error: embedError } = await supabase
            .from('document_embeddings')
            .insert({
              document_id: document.id,
              corporate_client_id: document.corporate_client_id,
              company_id: document.company_id,
              chunk_index: i,
              chunk_text: chunks[i],
              chunk_tokens: Math.ceil(chunks[i].length / 4), // Aproximación: 1 token ≈ 4 caracteres
              embedding: embedding,
              processing_status: 'completed',
              processing_started_at: new Date().toISOString(),
              processing_completed_at: new Date().toISOString(),
              rag_provider: provider,
              metadata: {
                chunk_length: chunks[i].length,
                estimated_tokens: Math.ceil(chunks[i].length / 4),
                provider: provider,
                model: providerConfig.embeddingModel
              }
            });

          if (embedError) {
            console.error(`Error saving chunk ${i}:`, embedError);
            failedChunks++;
          } else {
            processedChunks++;
          }

          embeddings.push(embedding);

          // Pequeña pausa para no sobrecargar la API
          if (i < chunks.length - 1) {
            await this.delay(100);
          }

        } catch (error) {
          console.error(`Error processing chunk ${i}:`, error);
          failedChunks++;
          
          // Guardar el chunk con estado de error
          await supabase
            .from('document_embeddings')
            .insert({
              document_id: document.id,
              corporate_client_id: document.corporate_client_id,
              company_id: document.company_id,
              chunk_index: i,
              chunk_text: chunks[i],
              chunk_tokens: Math.ceil(chunks[i].length / 4),
              processing_status: 'failed',
              processing_error: error.message,
              processing_started_at: new Date().toISOString(),
              rag_provider: provider
            });
        }
      }

      // 4. Actualizar el trabajo de procesamiento
      const processingTime = Date.now() - startTime;
      await supabase
        .from('rag_processing_jobs')
        .update({
          job_status: failedChunks === 0 ? 'completed' : 'completed_with_errors',
          total_chunks: chunks.length,
          processed_chunks: processedChunks,
          failed_chunks: failedChunks,
          completed_at: new Date().toISOString(),
          processing_time_ms: processingTime
        })
        .eq('id', job.id);

      return {
        success: true,
        chunksProcessed: processedChunks,
        chunksTotal: chunks.length,
        chunksFailed: failedChunks,
        embeddingsGenerated: embeddings.length,
        processingTime: processingTime,
        jobId: job.id,
        ragProvider: provider
      };

    } catch (error) {
      console.error('Error processing document:', error);
      
      // Actualizar trabajo con error
      if (job) {
        await supabase
          .from('rag_processing_jobs')
          .update({
            job_status: 'failed',
            error_message: error.message,
            completed_at: new Date().toISOString()
          })
          .eq('id', job.id);
      }
      
      throw error;
    }
  }

  /**
   * Realiza búsqueda semántica en los documentos
   */
  async semanticSearch(corporateClientId, query, options = {}) {
    const {
      similarityThreshold = 0.7,
      maxResults = 10,
      useCache = true,
      ragProvider = 'openai',
      ragApiKey = null
    } = options;

    try {
      // 1. Generar embedding para la consulta
      const queryEmbedding = await this.generateEmbedding(query, ragProvider, ragApiKey);

      // 2. Verificar caché si está habilitado
      if (useCache) {
        const cachedResult = await this.getCachedSearch(
          corporateClientId,
          query,
          queryEmbedding,
          similarityThreshold,
          maxResults
        );
        
        if (cachedResult) {
          return cachedResult;
        }
      }

      // 3. Realizar búsqueda en la base de datos
      const { data: results, error } = await supabase
        .rpc('search_similar_documents', {
          p_corporate_client_id: corporateClientId,
          p_query_embedding: queryEmbedding,
          p_similarity_threshold: similarityThreshold,
          p_max_results: maxResults
        });

      if (error) throw error;

      // 4. Agrupar resultados por documento y calcular scores
      const documentResults = this.groupResultsByDocument(results);

      // 5. Guardar en caché
      if (useCache && documentResults.length > 0) {
        await this.saveSearchCache(
          corporateClientId,
          query,
          queryEmbedding,
          documentResults,
          similarityThreshold,
          maxResults
        );
      }

      return {
        query,
        results: documentResults,
        totalResults: results.length,
        processingTime: Date.now(),
        fromCache: false,
        ragProvider: ragProvider
      };

    } catch (error) {
      console.error('Error in semantic search:', error);
      throw error;
    }
  }

  /**
   * Agrupa resultados por documento y calcula scores agregados
   */
  groupResultsByDocument(results) {
    const documentMap = new Map();

    results.forEach(result => {
      if (!documentMap.has(result.document_id)) {
        documentMap.set(result.document_id, {
          documentId: result.document_id,
          title: result.document_title,
          category: result.document_category,
          chunks: [],
          maxSimilarity: 0,
          avgSimilarity: 0,
          totalSimilarity: 0
        });
      }

      const docResult = documentMap.get(result.document_id);
      docResult.chunks.push({
        index: result.chunk_index,
        text: result.chunk_text,
        similarity: result.similarity
      });

      docResult.totalSimilarity += result.similarity;
      docResult.maxSimilarity = Math.max(docResult.maxSimilarity, result.similarity);
    });

    // Calcular promedios y ordenar resultados
    const documentResults = Array.from(documentMap.values());
    documentResults.forEach(doc => {
      doc.avgSimilarity = doc.totalSimilarity / doc.chunks.length;
    });

    return documentResults.sort((a, b) => b.maxSimilarity - a.maxSimilarity);
  }

  /**
   * Obtiene resultado cacheado de búsqueda
   */
  async getCachedSearch(corporateClientId, query, queryEmbedding, similarityThreshold, maxResults) {
    try {
      const { data, error } = await supabase
        .from('semantic_search_cache')
        .select('*')
        .eq('corporate_client_id', corporateClientId)
        .eq('query_text', query)
        .eq('similarity_threshold', similarityThreshold)
        .eq('max_results', maxResults)
        .gt('expires_at', new Date().toISOString())
        .single();

      if (error || !data) return null;

      // Actualizar contador de acceso
      await supabase
        .from('semantic_search_cache')
        .update({
          hit_count: data.hit_count + 1,
          last_accessed_at: new Date().toISOString()
        })
        .eq('id', data.id);

      return {
        query,
        results: data.cached_results,
        totalResults: data.cached_results.length,
        processingTime: 0,
        fromCache: true
      };

    } catch (error) {
      console.error('Error getting cached search:', error);
      return null;
    }
  }

  /**
   * Guarda resultado de búsqueda en caché
   */
  async saveSearchCache(corporateClientId, query, queryEmbedding, results, similarityThreshold, maxResults) {
    try {
      await supabase
        .from('semantic_search_cache')
        .upsert({
          corporate_client_id: corporateClientId,
          query_text: query,
          query_embedding: queryEmbedding,
          cached_results: results,
          similarity_threshold: similarityThreshold,
          max_results: maxResults,
          expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 horas
          created_at: new Date().toISOString()
        }, {
          onConflict: 'corporate_client_id,query_text,similarity_threshold,max_results'
        });

    } catch (error) {
      console.error('Error saving search cache:', error);
      // No lanzar error, la caché no debe bloquear la búsqueda
    }
  }

  /**
   * Obtiene el estado de vectorización de un documento
   */
  async getDocumentVectorStatus(documentId) {
    try {
      const { data, error } = await supabase
        .from('document_embeddings')
        .select('processing_status, chunk_index, created_at')
        .eq('document_id', documentId)
        .order('chunk_index');

      if (error) throw error;

      if (!data || data.length === 0) {
        return { status: 'pending', chunksCount: 0 };
      }

      const statusCounts = data.reduce((acc, chunk) => {
        acc[chunk.processing_status] = (acc[chunk.processing_status] || 0) + 1;
        return acc;
      }, {});

      const hasFailed = statusCounts.failed > 0;
      const hasPending = statusCounts.pending > 0;
      const hasProcessing = statusCounts.processing > 0;
      const allCompleted = statusCounts.completed === data.length;

      let status = 'pending';
      if (hasProcessing) status = 'processing';
      else if (hasFailed && !allCompleted) status = 'failed';
      else if (allCompleted) status = 'completed';
      else if (hasPending) status = 'pending';

      return {
        status,
        chunksCount: data.length,
        completedChunks: statusCounts.completed || 0,
        failedChunks: statusCounts.failed || 0,
        pendingChunks: statusCounts.pending || 0,
        processingChunks: statusCounts.processing || 0,
        lastUpdated: Math.max(...data.map(d => new Date(d.created_at).getTime()))
      };

    } catch (error) {
      console.error('Error getting document vector status:', error);
      return { status: 'error', message: error.message };
    }
  }

  /**
   * Elimina todos los embeddings de un documento
   */
  async deleteDocumentEmbeddings(documentId) {
    try {
      const { error } = await supabase
        .from('document_embeddings')
        .delete()
        .eq('document_id', documentId);

      if (error) throw error;

      return { success: true };

    } catch (error) {
      console.error('Error deleting document embeddings:', error);
      throw error;
    }
  }

  /**
   * Obtiene estadísticas RAG para un cliente corporativo
   */
  async getRAGStatistics(corporateClientId) {
    try {
      const { data, error } = await supabase
        .from('rag_statistics')
        .select('*')
        .eq('corporate_client_id', corporateClientId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      return data || {
        documents_vectorized: 0,
        total_chunks: 0,
        avg_chunk_tokens: 0,
        completed_chunks: 0,
        failed_chunks: 0,
        last_vectorization: null,
        total_processing_jobs: 0,
        completed_jobs: 0,
        avg_processing_time_ms: 0
      };

    } catch (error) {
      console.error('Error getting RAG statistics:', error);
      throw error;
    }
  }

  /**
   * Limpia caché expirado
   */
  async cleanupExpiredCache() {
    try {
      const { data, error } = await supabase
        .rpc('cleanup_expired_cache');

      if (error) throw error;

      return data || 0;

    } catch (error) {
      console.error('Error cleaning up expired cache:', error);
      return 0;
    }
  }
}

// Exportar instancia única del servicio
export const ragService = new RAGService();
export default ragService;