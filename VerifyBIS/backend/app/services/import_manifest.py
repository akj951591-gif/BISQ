import csv
from pathlib import Path

from sqlalchemy import select

from app.core.config import settings
from app.db.session import SessionLocal
from app.models.bis import BISStandard


MANIFEST_PATH = Path(settings.BIS_MANIFEST_PATH)


def clean(value):
    if value is None:
        return None

    value = str(value).strip()

    return value if value else None


def to_int(value):
    value = clean(value)

    if not value:
        return None

    try:
        return int(float(value))
    except (ValueError, TypeError):
        return None


def import_manifest():
    print(f"Reading manifest: {MANIFEST_PATH}")

    if not MANIFEST_PATH.exists():
        raise FileNotFoundError(
            f"BIS manifest not found: {MANIFEST_PATH}"
        )

    db = SessionLocal()

    inserted = 0
    updated = 0
    skipped = 0

    try:
        with open(
            MANIFEST_PATH,
            "r",
            encoding="utf-8-sig",
            newline=""
        ) as file:

            reader = csv.DictReader(file)

            print("Manifest columns:")
            print(reader.fieldnames)

            for row in reader:

                document_id = clean(row.get("document_id"))

                if not document_id:
                    skipped += 1
                    continue

                existing = db.scalar(
                    select(BISStandard).where(
                        BISStandard.document_id == document_id
                    )
                )

                data = {
                    "document_id": document_id,
                    "is_number": clean(row.get("is_number")),
                    "year": to_int(row.get("year")),
                    "title": clean(row.get("is_title")),
                    "amendments": clean(row.get("amendments")),
                    "committee": clean(row.get("committee")),
                    "equivalent": clean(row.get("equivalent")),
                    "superseding": clean(row.get("superseding")),
                    "supersede_by": clean(row.get("supersede_by")),
                    "division": clean(row.get("division")),
                    "pdf_url": clean(row.get("pdf_url")),
                    "txt_url": clean(row.get("txt_url")),
                }

                if existing:
                    for key, value in data.items():
                        setattr(existing, key, value)

                    updated += 1

                else:
                    db.add(BISStandard(**data))
                    inserted += 1

                total_processed = inserted + updated

                if total_processed % 500 == 0:
                    db.commit()

                    print(
                        f"Processed {total_processed} records "
                        f"(inserted={inserted}, updated={updated})"
                    )

        db.commit()

        print()
        print("========================================")
        print("BIS MANIFEST IMPORT COMPLETE")
        print("========================================")
        print(f"Inserted : {inserted}")
        print(f"Updated  : {updated}")
        print(f"Skipped  : {skipped}")
        print(f"Total    : {inserted + updated}")
        print("========================================")

    except Exception:
        db.rollback()
        raise

    finally:
        db.close()


if __name__ == "__main__":
    import_manifest()