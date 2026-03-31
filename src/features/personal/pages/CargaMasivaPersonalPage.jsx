import { useRef, useState } from 'react';
import * as XLSX from 'xlsx';
import DashboardLayout from '../../../app/layouts/DashboardLayout';
import {
  Upload,
  Download,
  Users,
  AlertTriangle,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Database,
} from 'lucide-react';
import {
  getPersonasBulkTemplateData,
  bulkUpsertPersonas,
} from '../../proyectos/services/personalService';

const cardStyle = {
  background: '#fff',
  border: '1px solid #e5e7eb',
  borderRadius: '20px',
  boxShadow: '0 10px 30px rgba(15, 23, 42, 0.06)',
};

const statCardStyle = {
  ...cardStyle,
  padding: '18px 20px',
  minHeight: '110px',
  display: 'flex',
  alignItems: 'center',
  gap: '14px',
};

const iconWrapStyle = (bg, color) => ({
  width: '52px',
  height: '52px',
  borderRadius: '16px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: bg,
  color,
  flexShrink: 0,
});

const actionBtnStyle = (variant = 'primary') => ({
  height: '46px',
  borderRadius: '14px',
  border: variant === 'primary' ? 'none' : '1px solid #d1d5db',
  background: variant === 'primary' ? '#16a34a' : '#ffffff',
  color: variant === 'primary' ? '#ffffff' : '#111827',
  padding: '0 18px',
  fontWeight: 700,
  display: 'inline-flex',
  alignItems: 'center',
  gap: '10px',
  cursor: 'pointer',
  boxShadow: variant === 'primary' ? '0 10px 20px rgba(37, 99, 235, 0.18)' : 'none',
});

export default function CargaMasivaPersonalPage() {
  const inputRef = useRef(null);

  const [loadingDownload, setLoadingDownload] = useState(false);
  const [loadingUpload, setLoadingUpload] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const splitNombres = (fullName = '') => {
    const parts = String(fullName || '').trim().split(/\s+/).filter(Boolean);
    return {
      primer_nombre: parts[0] || '',
      segundo_nombre: parts.slice(1).join(' ') || '',
    };
  };

  const splitApellidos = (fullName = '') => {
    const parts = String(fullName || '').trim().split(/\s+/).filter(Boolean);
    return {
      primer_apellido: parts[0] || '',
      segundo_apellido: parts.slice(1).join(' ') || '',
    };
  };

  const buildTemplateWorkbook = (data) => {
    const personas = (data?.personas || []).map((p) => {
      const nombres = splitNombres(p.nombres);
      const apellidos = splitApellidos(p.apellidos);

      return {
        operacion: 'ACTUALIZAR',
        persona_id: p._id,
        cedula: p.num_doc || '',
        primer_nombre: nombres.primer_nombre,
        segundo_nombre: nombres.segundo_nombre,
        primer_apellido: apellidos.primer_apellido,
        segundo_apellido: apellidos.segundo_apellido,
        cargo: p.cargo || '',
        tipo_contrato: p.tipo_contrato || '',
        fecha_ingreso: p.fecha_ingreso ? String(p.fecha_ingreso).slice(0, 10) : '',
        estado: p.estado || 'ACTIVO',
        finca_id: p?.finca?._id || '',
        proceso_id: p?.proceso?._id || '',
        supervisor_id: p?.supervisor?._id || '',
      };
    });

    const fincas = (data?.fincas || []).map((f) => ({
      finca_id: f._id,
      codigo: f.codigo || '',
      nombre: f.nombre || '',
    }));

    const procesos = (data?.procesos || []).map((p) => ({
      proceso_id: p._id,
      codigo: p.codigo || '',
      nombre: p.nombre || '',
    }));

    const supervisores = (data?.supervisores || []).map((s) => ({
      supervisor_id: s._id,
      cedula: s.num_doc || '',
      nombres: s.nombres || '',
      apellidos: s.apellidos || '',
      cargo: s.cargo || '',
    }));

    const instrucciones = [
      {
        regla: 'CREAR',
        descripcion: 'Usa operacion=CREAR, deja persona_id vacío y diligencia los campos obligatorios.',
      },
      {
        regla: 'ACTUALIZAR',
        descripcion: 'Usa operacion=ACTUALIZAR y diligencia persona_id para actualizar un registro existente.',
      },
      {
        regla: 'FECHA',
        descripcion: 'fecha_ingreso debe ir como YYYY-MM-DD o DD/MM/YYYY.',
      },
      {
        regla: 'RELACIONES',
        descripcion: 'finca_id, proceso_id y supervisor_id deben tomarse de sus hojas de referencia.',
      },
    ];

    const wb = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(personas), 'Personal');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(fincas), 'Fincas');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(procesos), 'Procesos');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(supervisores), 'Supervisores');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(instrucciones), 'Instrucciones');

    return wb;
  };

  const handleDownloadTemplate = async () => {
    try {
      setLoadingDownload(true);
      setError('');
      const res = await getPersonasBulkTemplateData();
      const wb = buildTemplateWorkbook(res?.data?.data || res?.data || {});
      XLSX.writeFile(wb, 'personal_masivo.xlsx');
    } catch (e) {
      console.error(e);
      setError('No se pudo descargar la plantilla de personal');
    } finally {
      setLoadingDownload(false);
    }
  };

  const parseRowsFromExcel = (rows) => {
    return rows
      .filter((row) => {
        const values = Object.values(row || {});
        return values.some((v) => String(v ?? '').trim() !== '');
      })
      .map((row, index) => ({
        rowNumber: index + 2,
        operacion: row.operacion,
        persona_id: row.persona_id,
        cedula: row.cedula,
        primer_nombre: row.primer_nombre,
        segundo_nombre: row.segundo_nombre,
        primer_apellido: row.primer_apellido,
        segundo_apellido: row.segundo_apellido,
        cargo: row.cargo,
        tipo_contrato: row.tipo_contrato,
        fecha_ingreso: row.fecha_ingreso,
        estado: row.estado,
        finca_id: row.finca_id,
        proceso_id: row.proceso_id,
        supervisor_id: row.supervisor_id,
      }));
  };

  const handleFileChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setLoadingUpload(true);
      setError('');
      setResult(null);

      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: 'array' });

      if (!workbook.Sheets['Personal']) {
        throw new Error('El archivo no contiene la hoja Personal');
      }

      const sheet = workbook.Sheets['Personal'];
      const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' });
      const payloadRows = parseRowsFromExcel(rows);

      const res = await bulkUpsertPersonas(payloadRows);
      setResult(res?.data?.data || res?.data || null);
    } catch (e) {
      console.error(e);
      setError(e?.message || 'No se pudo procesar el archivo');
    } finally {
      setLoadingUpload(false);
      if (inputRef.current) {
        inputRef.current.value = '';
      }
    }
  };

  // SOLO CAMBIA EL RETURN (todo lo demás déjalo igual)

  return (
    <DashboardLayout>
      <div style={{ padding: '24px' }}>
        <div style={{ ...cardStyle, padding: '28px' }}>

          {/* HEADER */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '24px',
              flexWrap: 'wrap',
              gap: '16px',
            }}
          >
            <div>
              <div
                style={{
                  background: '#dcfce7',
                  color: '#166534',
                  padding: '6px 12px',
                  borderRadius: '999px',
                  fontSize: '12px',
                  fontWeight: 700,
                  display: 'inline-block',
                  marginBottom: '10px',
                }}
              >
                Gestión masiva personal
              </div>

              <h1 style={{ margin: 0, fontSize: '28px', fontWeight: 800 }}>
                Carga masiva de personal
              </h1>

              <p style={{ color: '#6b7280', marginTop: '6px' }}>
                Descarga la plantilla, edita los datos y vuelve a subir el archivo.
              </p>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={handleDownloadTemplate} style={actionBtnStyle('secondary')}>
                <Download size={16} /> Descargar
              </button>

              <label style={actionBtnStyle('primary')}>
                <Upload size={16} /> Subir Excel
                <input
                  ref={inputRef}
                  type="file"
                  onChange={handleFileChange}
                  style={{ display: 'none' }}
                />
              </label>
            </div>
          </div>

          {/* PASOS */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '16px',
              marginBottom: '20px',
            }}
          >
            <div style={{ ...cardStyle, padding: '18px' }}>
              <Download />
              <h4>1. Descarga</h4>
              <p style={{ fontSize: '13px', color: '#6b7280' }}>
                Plantilla con datos de personal e instrucciones.
              </p>
            </div>

            <div style={{ ...cardStyle, padding: '18px' }}>
              <Database />
              <h4>2. Edita</h4>
              <p style={{ fontSize: '13px', color: '#6b7280' }}>
                Completa los campos requeridos correctamente.
              </p>
            </div>

            <div style={{ ...cardStyle, padding: '18px' }}>
              <Upload />
              <h4>3. Sube</h4>
              <p style={{ fontSize: '13px', color: '#6b7280' }}>
                Sube el archivo y revisa los resultados.
              </p>
            </div>
          </div>

          {/* 🔥 ZONA VERDE EXACTA */}
          <div
            style={{
              border: '2px dashed #86efac',
              background: '#f0fdf4',
              borderRadius: '16px',
              padding: '20px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '12px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Upload size={24} color="#16a34a" />

              <div>
                <div style={{ fontWeight: 700 }}>
                  Zona de carga rápida
                </div>

                <div style={{ fontSize: '13px', color: '#6b7280' }}>
                  El archivo debe contener la hoja Personal correctamente estructurada.
                </div>
              </div>
            </div>

            <label
              style={{
                background: '#16a34a',
                color: '#fff',
                padding: '10px 16px',
                borderRadius: '10px',
                cursor: 'pointer',
                fontWeight: 600,
              }}
            >
              Seleccionar archivo
              <input
                ref={inputRef}
                type="file"
                onChange={handleFileChange}
                style={{ display: 'none' }}
              />
            </label>
          </div>

          {/* RESULTADOS */}
          {result && (
            <div style={{ marginTop: '24px' }}>
              <pre>{JSON.stringify(result, null, 2)}</pre>
            </div>
          )}

          {/* ERROR */}
          {error && (
            <div style={{ color: 'red', marginTop: '12px' }}>
              {error}
            </div>
          )}

        </div>
      </div>
    </DashboardLayout>
  );
}