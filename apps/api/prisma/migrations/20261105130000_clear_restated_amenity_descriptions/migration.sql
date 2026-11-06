-- Owner feedback 2026-11-05: a description that only restates the name ("El hotel cuenta con
-- paneles solares.") is noise. Clear the two seeded ones on the migrated HOTEL amenities; any text
-- an admin wrote is kept. The site renders a description only when present.
UPDATE "Amenity"
SET description = NULL, "updatedAt" = now()
WHERE scope = 'HOTEL'
  AND description IN ('El hotel cuenta con paneles solares.', 'El hotel cuenta con reserva de agua.');
