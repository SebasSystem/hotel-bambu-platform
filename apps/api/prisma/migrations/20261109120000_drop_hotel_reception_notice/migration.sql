-- Owner decision 2026-11-09: the child-protection notice is the physical code posted at reception,
-- not website content. Drop the optional profile column.
ALTER TABLE "HotelProfile" DROP COLUMN "escnnaNotice";
