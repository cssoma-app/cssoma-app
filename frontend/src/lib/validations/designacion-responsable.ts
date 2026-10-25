import { z } from 'zod'

export const designacionResponsableSchema = z.object({
  coberturaCentroTrabajo: z.string().min(1, 'Cobertura es requerida'),
  coberturaDetalle: z.string().optional(),
  responsableNombreCompleto: z.string().min(3, 'Nombre requerido'),
  responsableCargo: z.string().min(2, 'Cargo requerido'),
  responsableTipoDocumento: z.enum(['Cc', 'Ce', 'Pasaporte']),
  responsableNumeroDocumento: z.string().min(3, 'Número de documento requerido'),
  nivelCompetencia: z.enum(['TecnicoSst', 'TecnologoSst', 'ProfesionalSst', 'EspecialistaSst']),
  licenciaSstNumero: z.string().min(1, 'Licencia SST requerida'),
  licenciaSstExpedidaPor: z.string().min(1, 'Expedida por requerido'),
  curso50HorasAprobado: z.boolean().default(false),
  fechaActualizacion20Horas: z.string().optional(),
  empleadorAceptaNombre: z.string().min(1, 'Nombre del empleador requerido'),
  empleadorAceptaCargo: z.string().min(1, 'Cargo del empleador requerido'),
  empleadorAceptaDocumento: z.string().min(1, 'Documento del empleador requerido'),
  responsableAceptaNombre: z.string().min(1, 'Nombre del responsable requerido'),
  responsableAceptaLicencia: z.string().min(1, 'Licencia del responsable requerida'),
  responsableAceptaDocumento: z.string().min(1, 'Documento del responsable requerido'),
  suscripcionCiudad: z.string().min(1, 'Ciudad requerida'),
  suscripcionFecha: z.string().min(1, 'Fecha requerida'),
  functionAcceptances: z.array(z.object({
    functionId: z.number(),
    isAccepted: z.boolean()
  }))
})

export type DesignacionResponsableForm = z.infer<typeof designacionResponsableSchema>
