-- Migração: Adicionar campo events_seen à tabela player_map_progress
-- Data: 2025-11-18
-- Descrição: Adiciona rastreamento de eventos únicos (one-time) por run

-- Adicionar coluna events_seen
ALTER TABLE player_map_progress
ADD COLUMN events_seen TEXT DEFAULT '[]';

-- Atualizar registros existentes para garantir que têm o valor padrão
UPDATE player_map_progress
SET events_seen = '[]'
WHERE events_seen IS NULL;
