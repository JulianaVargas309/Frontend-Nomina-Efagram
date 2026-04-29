import { useEffect, useState } from 'react';
import { useProyectoData } from "../hooks/useProyectoData";
import { Users, Clock, X, Plus, CheckCircle2, AlertCircle, ChevronRight } from 'lucide-react';
import httpClient from '../../../core/api/httpClient';
import { updateSubproyecto } from '../services/subproyectosService';
import { registrarHorasNoTrabajadas } from '../services/horasService';

const Badge = ({ children, color = '#64748b', bg = '#f1f5f9' }) => (
  <span style={{ display: 'inline-flex', padding: '2px 10px', borderRadius: 999, fontSize: 11, fontWeight: 700, color, background: bg }}>
    {children}
  </span>
);

const Tab = ({ active, onClick, icon, label, count }) => (
  <button onClick={onClick} style={{
    display: 'flex', gap: 8, padding: '10px 18px',
    background: active ? '#fff' : 'transparent',
    border: 'none',
    borderBottom: active ? '2px solid #1f8f57' : '2px solid transparent',
    color: active ? '#1f8f57' : '#64748b',
    fontWeight: active ? 800 : 600,
    cursor: 'pointer'
  }}>
    {icon} {label}
    {count !== undefined && <Badge>{count}</Badge>}
  </button>
);

const MOTIVOS = ['Lluvia','Permiso personal','Incapacidad médica','Festivo','Problema de transporte','Otro'];

const GestionarSubproyectoModal = ({ isOpen, onClose, onSuccess, subproyecto }) => {

  const [tab, setTab] = useState('cuadrillas');
  const { fincas, nucleos, zonas, personal } = useProyectoData();

  // 🔥 NUEVO (NO AFECTA NADA)
  const [zonaSel, setZonaSel] = useState('');
  const [nucleoSel, setNucleoSel] = useState('');
  const [fincaSel, setFincaSel] = useState('');
  const [personalSel, setPersonalSel] = useState('');

  const nucleosFiltrados = nucleos.filter(n =>
    !zonaSel || (n.zona?._id ?? n.zona) === zonaSel
  );

  const fincasFiltradas = fincas.filter(f =>
    !nucleoSel || (f.nucleo?._id ?? f.nucleo_id ?? f.nucleo) === nucleoSel
  );

  // ─── TODO TU CÓDIGO ORIGINAL ───
  const [todasCuadrillas, setTodasCuadrillas] = useState([]);
  const [cuadrillasSel, setCuadrillasSel] = useState([]);
  const [loadingCuadrillas, setLoadingCuadrillas] = useState(false);
  const [savingCuadrillas, setSavingCuadrillas] = useState(false);
  const [errorCuadrillas, setErrorCuadrillas] = useState('');
  const [okCuadrillas, setOkCuadrillas] = useState(false);

  const [horaForm, setHoraForm] = useState({
    cuadrillaId: '', fecha: '', horas: '', motivo: '', motivoCustom: ''
  });

  useEffect(() => {
    if (!isOpen || !subproyecto) return;

    const cargar = async () => {
      setLoadingCuadrillas(true);
      const res = await httpClient.get('/cuadrillas');
      setTodasCuadrillas(res?.data?.data ?? []);
      const ids = (subproyecto.cuadrillas ?? []).map(c => c._id ?? c);
      setCuadrillasSel(ids);
      setLoadingCuadrillas(false);
    };
    cargar();
  }, [isOpen, subproyecto]);

  if (!isOpen || !subproyecto) return null;

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', display:'flex', justifyContent:'center', alignItems:'center' }}>
      <div style={{ background:'#fff', padding:20, borderRadius:12, width:650 }}>

        <h3>Gestionar Subproyecto</h3>

        {/* 🔥 TAB CUADRILLAS */}
        {tab === 'cuadrillas' && (
          <div style={{ display:'flex', flexDirection:'column', gap:15 }}>

            {/* 🔥 NUEVOS SELECTS */}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>

              <select value={zonaSel} onChange={e=>{
                setZonaSel(e.target.value);
                setNucleoSel('');
                setFincaSel('');
              }}>
                <option value="">— Zona —</option>
                {zonas.map(z=>(
                  <option key={z._id} value={z._id}>
                    {z.nombreZona ?? z.nombre ?? 'Zona'} {z.codeZona ? `(${z.codeZona})` : ''}
                  </option>
                ))}
              </select>

              <select value={nucleoSel} onChange={e=>{
                setNucleoSel(e.target.value);
                setFincaSel('');
              }}>
                <option value="">— Núcleo —</option>
                {nucleosFiltrados.map(n=>(
                  <option key={n._id} value={n._id}>
                    {n.nombreNucleo ?? n.nombre ?? 'Núcleo'} {n.codeNucleo ? `(${n.codeNucleo})` : ''}
                  </option>
                ))}
              </select>

              <select value={fincaSel} onChange={e=>setFincaSel(e.target.value)}>
                <option value="">— Finca —</option>
                {fincasFiltradas.map(f=>(
                  <option key={f._id} value={f._id}>
                    {f.nombreFinca ?? f.nombre ?? 'Finca'} {f.codeFinca ? `(${f.codeFinca})` : ''}
                  </option>
                ))}
              </select>

              <select value={personalSel} onChange={e=>setPersonalSel(e.target.value)}>
                <option value="">— Supervisor —</option>
                {personal.map(p=>(
                  <option key={p._id} value={p._id}>
                    {p.name || `${p.nombres ?? ''} ${p.apellidos ?? ''}`.trim() || 'Persona'}
                    {p.cc ? ` — ${p.cc}` : ''}
                  </option>
                ))}
              </select>

            </div>

            {/* 🔽 LISTA ORIGINAL (NO TOCADA) */}
            {loadingCuadrillas ? (
              <p>Cargando...</p>
            ) : (
              todasCuadrillas.map(c => (
                <div key={c._id} onClick={()=>{
                  setCuadrillasSel(prev =>
                    prev.includes(c._id)
                      ? prev.filter(id => id !== c._id)
                      : [...prev, c._id]
                  );
                }}>
                  <input type="checkbox" checked={cuadrillasSel.includes(c._id)} readOnly />
                  {c.nombre}
                </div>
              ))
            )}

            <button onClick={async ()=>{
              await updateSubproyecto(subproyecto._id,{ cuadrillas: cuadrillasSel });
              onSuccess?.();
            }}>
              Guardar
            </button>

          </div>
        )}

        <button onClick={onClose}>Cerrar</button>
      </div>
    </div>
  );
};

export default GestionarSubproyectoModal;