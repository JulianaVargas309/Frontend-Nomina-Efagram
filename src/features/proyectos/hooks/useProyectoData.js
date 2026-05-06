import { useEffect, useState } from "react";

// territorial
import { getFincas } from "../../territorial/services/fincas.service";
import { getNucleos } from "../../territorial/services/nucleos.service";
import { getZonas } from "../../territorial/services/zonas.service";

// proyectos
import { getPersonal } from "../services/personalService";

/**
 * Normaliza la respuesta de httpEfaStack:
 *   - Array directo → lo devuelve
 *   - { zonas: [] }, { nucleos: [] }, { fincas: [] }, { data: [] }, { data: { data: [] } }
 */
const extractArray = (res) => {
  if (Array.isArray(res)) return res;
  if (Array.isArray(res?.zonas))   return res.zonas;
  if (Array.isArray(res?.nucleos)) return res.nucleos;
  if (Array.isArray(res?.fincas))  return res.fincas;
  if (Array.isArray(res?.users))   return res.users;
  if (Array.isArray(res?.data))    return res.data;
  if (Array.isArray(res?.data?.data)) return res.data.data;
  return [];
};

export const useProyectoData = () => {
  const [data, setData] = useState({
    fincas: [],
    nucleos: [],
    zonas: [],
    personal: [],
  });

  useEffect(() => {
    const cargar = async () => {
      try {
        const [fincasRes, nucleosRes, zonasRes, personalRes] = await Promise.allSettled([
          getFincas(),
          getNucleos(),
          getZonas(),
          getPersonal(),
        ]);

        setData({
          fincas:   extractArray(fincasRes.status   === "fulfilled" ? fincasRes.value   : []),
          nucleos:  extractArray(nucleosRes.status  === "fulfilled" ? nucleosRes.value  : []),
          zonas:    extractArray(zonasRes.status    === "fulfilled" ? zonasRes.value    : []),
          personal: extractArray(personalRes.status === "fulfilled" ? personalRes.value : []),
        });
      } catch (e) {
        console.error("useProyectoData error:", e);
      }
    };

    cargar();
  }, []);

  return data;
};