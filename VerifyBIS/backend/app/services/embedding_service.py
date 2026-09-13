from sentence_transformers import SentenceTransformer


MODEL_NAME = "BAAI/bge-m3"

_model = None


def get_model() -> SentenceTransformer:
    # Loaded on first use, not at import time: the model is ~2.3GB, and
    # loading it during import blocks uvicorn from binding its port.
    global _model

    if _model is None:
        print(f"Loading embedding model: {MODEL_NAME}")
        _model = SentenceTransformer(MODEL_NAME)
        print("Embedding model loaded.")

    return _model


def generate_embedding(text: str) -> list[float]:
    embedding = get_model().encode(
        text,
        normalize_embeddings=True,
    )

    return embedding.tolist()


def generate_embeddings(texts: list[str]) -> list[list[float]]:
    embeddings = get_model().encode(
        texts,
        normalize_embeddings=True,
        batch_size=8,
        show_progress_bar=True,
    )

    return embeddings.tolist()