import { useState, useRef, useEffect } from "react";
import { Search, Check, ChevronDown } from "lucide-react";

const SearchableSelect = ({
  options = [],
  value,
  onChange,
  placeholder = "Seleccione una opción",
  searchPlaceholder = "Buscar...",
  disabled = false,
  renderOption,
  renderSelected,
  filterFn,
}) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const containerRef = useRef(null);
  const searchRef = useRef(null);

  const filtered = query
    ? options.filter((opt) =>
        filterFn ? filterFn(opt, query) : JSON.stringify(opt).toLowerCase().includes(query.toLowerCase())
      )
    : options;

  const selected = options.find((o) => o._id === value);

  useEffect(() => {
    if (open) setTimeout(() => searchRef.current?.focus(), 50);
  }, [open]);

  useEffect(() => {
    const handler = (e) => {
      if (!containerRef.current?.contains(e.target)) {
        setOpen(false);
        setQuery("");
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSelect = (opt) => {
    onChange(opt._id);
    setOpen(false);
    setQuery("");
  };

  return (
    <div ref={containerRef} style={{ position: "relative" }}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((p) => !p)}
        style={{
          width: "100%",
          padding: "9px 36px 9px 12px",
          border: "1px solid #e2e8f0",
          borderRadius: 10,
          background: disabled ? "#f8fafc" : "#fff",
          fontSize: 14,
          color: selected ? "#0f172a" : "#94a3b8",
          cursor: disabled ? "not-allowed" : "pointer",
          textAlign: "left",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 8,
        }}
      >
        <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {disabled ? "Cargando..." : selected ? (renderSelected ? renderSelected(selected) : selected.nombre ?? selected.name) : placeholder}
        </span>
        <ChevronDown
          size={15}
          color="#94a3b8"
          style={{ flexShrink: 0, transition: "transform .2s", transform: open ? "rotate(180deg)" : "none" }}
        />
      </button>

      {open && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 4px)",
            left: 0,
            right: 0,
            background: "#fff",
            border: "1px solid #e2e8f0",
            borderRadius: 12,
            boxShadow: "0 8px 24px rgba(15,23,42,0.12)",
            zIndex: 300,
            overflow: "hidden",
          }}
        >
          <div style={{ padding: "10px 10px 6px", position: "relative" }}>
            <Search
              size={14}
              color="#94a3b8"
              style={{ position: "absolute", left: 22, top: "50%", transform: "translateY(-50%)" }}
            />
            <input
              ref={searchRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={searchPlaceholder}
              style={{
                width: "100%",
                padding: "7px 10px 7px 32px",
                border: "1px solid #e2e8f0",
                borderRadius: 8,
                fontSize: 13,
                background: "#f8fafc",
                outline: "none",
              }}
            />
          </div>

          <div style={{ maxHeight: 220, overflowY: "auto", padding: "4px 6px 6px" }}>
            {filtered.length === 0 ? (
              <p style={{ textAlign: "center", color: "#94a3b8", fontSize: 13, padding: "16px 0", margin: 0 }}>
                Sin resultados
              </p>
            ) : (
              filtered.map((opt) => (
                <div
                  key={opt._id}
                  onClick={() => handleSelect(opt)}
                  style={{
                    padding: "9px 10px",
                    borderRadius: 8,
                    fontSize: 13,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    background: opt._id === value ? "#e8f5ee" : "transparent",
                    color: opt._id === value ? "#1f8f57" : "#0f172a",
                    fontWeight: opt._id === value ? 600 : 400,
                  }}
                  onMouseEnter={(e) => { if (opt._id !== value) e.currentTarget.style.background = "#f1f5f9"; }}
                  onMouseLeave={(e) => { if (opt._id !== value) e.currentTarget.style.background = "transparent"; }}
                >
                  {renderOption ? renderOption(opt) : <span style={{ flex: 1 }}>{opt.nombre ?? opt.name}</span>}
                  {opt._id === value && <Check size={14} color="#1f8f57" style={{ flexShrink: 0 }} />}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchableSelect;