import { useState } from 'react';
import { Eye, Plus, Search, Layers, X } from 'lucide-react';


function NucleoDetalleModal({ isOpen, nucleo, onClose }) {
    if (!isOpen || !nucleo) return null;

    let isActive = false;
    const raw = nucleo?.activo ?? nucleo?.activa ?? nucleo?.estado;
    if (typeof raw === 'boolean') isActive = raw;
    else if (typeof raw === 'string') {
        const v = raw.toLowerCase().trim();
        isActive = v === 'activo' || v === 'activa' || v === 'active' || v === 'true' || v === '1';
    } else if (typeof raw === 'number') isActive = raw === 1;

    return (
        <>
            <div className="zdm-overlay" />
            <div className="zdm-panel" role="dialog" aria-modal="true">
                <button className="zdm-close" onClick={onClose} aria-label="Cerrar"><X size={15} /></button>

                <div className="zdm-header">
                    <h2 className="zdm-title">Detalle de Núcleo</h2>
                    <p className="zdm-subtitle">Información del núcleo territorial</p>
                </div>

                <div className="zdm-name-card">
                    <div className="zdm-pin-wrap" style={{ background: '#f0f7ff', borderColor: '#2563eb', color: '#2563eb' }}>
                        <Layers size={20} />
                    </div>
                    <div className="zdm-name-info">
                        <span className="zdm-name">{nucleo?.nombre ?? '-'}</span>
                        <span className="zdm-code">{nucleo?.codigo ?? '-'}</span>
                    </div>
                </div>

                {nucleo?.zona && (
                    <div className="zdm-estado-box" style={{ marginBottom: 8 }}>
                        <span className="zdm-estado-label">Zona</span>
                        <span style={{ fontSize: 13, color: '#374151', fontWeight: 500 }}>
                            {typeof nucleo.zona === 'object' ? (nucleo.zona?.nombre ?? '-') : nucleo.zona}
                        </span>
                    </div>
                )}


            </div>
        </>
    );
}

export default function NucleosTable({ nucleos = [], zonas = [], search = '', setSearch, onAdd, onUpdate, onDelete }) {
    const [openCreate, setOpenCreate] = useState(false);
    const [detalleNucleo, setDetalleNucleo] = useState(null);
    const getId = (n) => n?._id ?? n?.id;

    // Ordena por orden de creación
    const nucleosOrdenados = [...nucleos].sort((a, b) => {
        const aId = a?._id ?? a?.id ?? '';
        const bId = b?._id ?? b?.id ?? '';
        const aIsMongoId = typeof aId === 'string' && /^[a-f0-9]{24}$/i.test(aId);
        const bIsMongoId = typeof bId === 'string' && /^[a-f0-9]{24}$/i.test(bId);
        if (aIsMongoId && bIsMongoId) {
            const aTs = parseInt(aId.substring(0, 8), 16);
            const bTs = parseInt(bId.substring(0, 8), 16);
            return aTs - bTs;
        }
        if (a?.createdAt && b?.createdAt) {
            return new Date(a.createdAt) - new Date(b.createdAt);
        }
        return 0;
    });

    const handleDelete = async (id) => {
        const ok = window.confirm('¿Eliminar este núcleo?');
        if (!ok) return;
        await onDelete?.(id);
    };

    const resolveZonaNombre = (n) => {
        if (!n?.zona) return '-';
        if (typeof n.zona === 'object') return n.zona?.nombre ?? '-';
        const found = zonas.find((z) => (z?._id ?? z?.id) === n.zona);
        return found?.nombre ?? n.zona;
    };

    // Función para truncar IDs largos
    const truncateZona = (zona) => {
        if (!zona || zona === '-') return '-';
        // Si es un string muy largo (probablemente un ID), trunca
        if (typeof zona === 'string' && zona.length > 20) {
            return zona.substring(0, 8)  + zona.substring(zona.length - 4);
        }
        return zona;
    };

    return (
        <div className="zonas-card">
            <div className="zonas-card-header">
                <h2 className="zonas-card-title">Núcleos Territoriales</h2>
                <div className="zonas-card-actions">
                    <div className="zonas-search">
                        <Search size={16} />
                        <input
                            value={search}
                            onChange={(e) => setSearch?.(e.target.value)}
                            placeholder="Buscar núcleo..."
                        />
                    </div>
                    
                </div>
            </div>

            <div className="zonas-table-scroll">
                <table className="zonas-table-grid" style={{ tableLayout: 'fixed', width: '100%' }}>
                    <colgroup>
                        <col style={{ width: '100px' }} />
                        <col style={{ width: 'auto' }} />
                        <col style={{ width: '180px' }} />
                        <col style={{ width: '100px' }} />
                    </colgroup>
                    <thead>
                        <tr>
                            <th className="th-code">Código</th>
                            <th className="th-name">Nombre</th>
                            <th>Zona</th>
                            <th className="th-actions">Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {nucleosOrdenados.length === 0 ? (
                            <tr><td colSpan={4} className="zonas-empty">No hay núcleos para mostrar</td></tr>
                        ) : (
                            nucleosOrdenados.map((n) => {
                                const id = getId(n);
                                let isActive = false;
                                const raw = n?.activo ?? n?.activa ?? n?.estado;
                                if (typeof raw === 'boolean') isActive = raw;
                                else if (typeof raw === 'string') {
                                    const v = raw.toLowerCase().trim();
                                    isActive = v === 'activo' || v === 'activa' || v === 'active' || v === 'true' || v === '1';
                                } else if (typeof raw === 'number') isActive = raw === 1;

                                const zonaValue = n?.codeZona ?? '-';

                                return (
                                    <tr key={id}>
                                        <td style={{ fontSize: 13 }}>{n?.codeNucleo ?? '-'}</td>
                                        <td>
                                            <div className="zona-name-cell">
                                                <span className="zona-pin-icon"><Layers size={13} /></span>
                                                {n?.nombreNucleo ?? '-'}
                                            </div>
                                        </td>
                                        <td style={{ 
                                            fontSize: 13, 
                                            color: '#374151',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            whiteSpace: 'nowrap'
                                        }} title={zonaValue}>
                                            {truncateZona(zonaValue)}
                                        </td>
                                        
                                        <td className="td-actions">
                                            <div className="td-actions-inner">
                                                <button className="icon-btn" type="button" title="Ver detalle" onClick={() => setDetalleNucleo(n)}><Eye size={16} /></button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>

            <NucleoDetalleModal isOpen={!!detalleNucleo} nucleo={detalleNucleo} onClose={() => setDetalleNucleo(null)} />

        </div>
    );
}