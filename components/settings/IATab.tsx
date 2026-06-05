"use client";

import { useEffect, useState } from "react";
import { Icon } from "@iconify/react";
import { getAllProviders, getProvider } from "@/lib/ai/providers";
import { getApiKeys, saveApiKey, removeApiKey, testApiKey } from "@/lib/db/repositories/api-key-repo";

type StoredKey = {
  provider: string;
  label: string;
  model: string;
  temperature: number;
};

export default function IATab() {
  const providers = getAllProviders();
  const [storedKeys, setStoredKeys] = useState<StoredKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingProvider, setEditingProvider] = useState<string | null>(null);
  const [formKey, setFormKey] = useState("");
  const [formModel, setFormModel] = useState("");
  const [testResult, setTestResult] = useState<"idle" | "testing" | "ok" | "fail">("idle");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadKeys();
  }, []);

  async function loadKeys() {
    setLoading(true);
    try {
      const docs = await getApiKeys();
      setStoredKeys(
        docs.map((d) => ({
          provider: d.provider,
          label: d.label,
          model: d.model,
          temperature: d.temperature,
        })),
      );
    } catch (err) {
      console.error("Failed to load API keys:", err);
    } finally {
      setLoading(false);
    }
  }

  const storedProviderIds = storedKeys.map((k) => k.provider);
  const unconfiguredProviders = providers.filter(
    (p) => !storedProviderIds.includes(p.id),
  );

  function startEdit(providerId: string) {
    setEditingProvider(providerId);
    const stored = storedKeys.find((k) => k.provider === providerId);
    const cfg = getProvider(providerId);
    setFormKey("");
    setFormModel(stored?.model ?? cfg?.defaultModel ?? "");
    setTestResult("idle");
  }

  function startAdd(providerId: string) {
    setEditingProvider(providerId);
    const cfg = getProvider(providerId);
    setFormKey("");
    setFormModel(cfg?.defaultModel ?? "");
    setTestResult("idle");
  }

  async function handleTest() {
    if (!editingProvider || !formKey) return;
    setTestResult("testing");
    const ok = await testApiKey(editingProvider, formKey, formModel);
    setTestResult(ok ? "ok" : "fail");
  }

  async function handleSave() {
    if (!editingProvider || !formKey) return;
    setSaving(true);
    try {
      await saveApiKey({
        provider: editingProvider,
        key: formKey,
        model: formModel,
      });
      await loadKeys();
      setEditingProvider(null);
      setFormKey("");
    } catch (err) {
      console.error("Failed to save API key:", err);
    } finally {
      setSaving(false);
    }
  }

  async function handleRemove(providerId: string) {
    if (!confirm(`Remover chave de ${providerId}?`)) return;
    await removeApiKey(providerId);
    await loadKeys();
  }

  if (loading) {
    return (
      <div className="text-sm text-on-surface-variant py-4">
        A carregar configurações...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-semibold text-on-surface mb-1">
          Chaves de API de IA
        </h3>
        <p className="text-xs text-on-surface-variant">
          As chaves são encriptadas localmente e nunca saem do teu dispositivo sem a tua autorização.
        </p>
      </div>

      {storedKeys.length > 0 && (
        <div className="space-y-2">
          {storedKeys.map((sk) => {
            const cfg = getProvider(sk.provider);
            return (
              <div
                key={sk.provider}
                className="flex items-center justify-between px-3 py-2 rounded-lg bg-surface-container border border-outline-variant"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-7 h-7 rounded-full bg-surface-container-high flex items-center justify-center text-xs font-bold text-on-surface-variant flex-shrink-0">
                    {cfg?.name.charAt(0) ?? sk.provider.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm text-on-surface font-medium truncate">
                      {cfg?.name ?? sk.provider}
                    </div>
                    <div className="text-xs text-on-surface-variant truncate">
                      {sk.model}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => startEdit(sk.provider)}
                    className="px-2 py-1 text-xs rounded-md text-on-surface-variant hover:text-primary hover:bg-surface-container-high transition-colors"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => handleRemove(sk.provider)}
                    className="px-2 py-1 text-xs rounded-md text-error hover:bg-error/10 transition-colors"
                  >
                    Remover
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add new provider */}
      {unconfiguredProviders.length > 0 && !editingProvider && (
        <div>
          <div className="text-xs text-on-surface-variant mb-2">
            Adicionar provedor
          </div>
          <div className="flex flex-wrap gap-2">
            {unconfiguredProviders.map((p) => (
              <button
                key={p.id}
                onClick={() => startAdd(p.id)}
                className="flex items-center gap-2 px-3 py-1.5 text-xs rounded-lg border border-outline-variant text-on-surface hover:bg-surface-container-high transition-colors"
              >
                <Icon icon="basil:plus-outline" width={14} height={14} />
                {p.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Edit form */}
      {editingProvider && (
        <div className="space-y-3 p-4 rounded-lg border border-outline-variant bg-surface-container-low">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-on-surface">
              {getProvider(editingProvider)?.name ?? editingProvider}
            </h4>
            <button
              onClick={() => setEditingProvider(null)}
              className="text-on-surface-variant hover:text-primary transition-colors"
            >
              <Icon icon="basil:cross-outline" width={16} height={16} />
            </button>
          </div>

          <div>
            <label className="block text-xs text-on-surface-variant mb-1">
              Chave de API
            </label>
            <input
              type="password"
              value={formKey}
              onChange={(e) => {
                setFormKey(e.target.value);
                setTestResult("idle");
              }}
              placeholder="sk-..."
              className="w-full px-3 py-1.5 text-sm bg-surface-container rounded-lg text-on-surface placeholder:text-on-surface-variant outline-none ring-1 ring-outline-variant focus:ring-accent transition-shadow"
            />
          </div>

          <div>
            <label className="block text-xs text-on-surface-variant mb-1">
              Modelo
            </label>
            <select
              value={formModel}
              onChange={(e) => setFormModel(e.target.value)}
              className="w-full px-3 py-1.5 text-sm bg-surface-container rounded-lg text-on-surface outline-none ring-1 ring-outline-variant focus:ring-accent transition-shadow"
            >
              {getProvider(editingProvider)?.models.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={handleTest}
              disabled={!formKey || testResult === "testing"}
              className="px-3 py-1.5 text-xs rounded-lg border border-outline-variant text-on-surface hover:bg-surface-container-high transition-colors disabled:opacity-40"
            >
              {testResult === "testing"
                ? "A testar..."
                : testResult === "ok"
                  ? "✅ Válida"
                  : testResult === "fail"
                    ? "❌ Inválida"
                    : "Testar"}
            </button>
            <button
              onClick={handleSave}
              disabled={!formKey || saving}
              className="px-3 py-1.5 text-xs rounded-lg bg-accent text-white hover:bg-accent/90 transition-colors disabled:opacity-40"
            >
              {saving ? "A guardar..." : "Guardar"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
