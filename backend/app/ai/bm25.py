"""BM25 retrieval engine over active, approved rules and facts."""

import re
from typing import Any

from rank_bm25 import BM25Okapi


def tokenize(text: str) -> list[str]:
    """Tokenize lowercase words for BM25 scoring."""
    return re.findall(r"\b\w+\b", text.lower())


class GuidelineRetriever:
    """Retrieves top-k active brand rules and facts relevant to query passage."""

    def __init__(self, rules: list[dict[str, Any]], facts: list[dict[str, Any]]):
        # Filter strictly for active items
        self.active_rules = [r for r in rules if r.get("status") == "active"]
        self.active_facts = [f for f in facts if f.get("status") == "active"]

        # Build corpus
        self.documents: list[dict[str, Any]] = []
        tokenized_corpus: list[list[str]] = []

        for r in self.active_rules:
            text_repr = f"{r.get('id', '')} {r.get('title', '')} {r.get('category', '')} {r.get('text', '')}"
            self.documents.append({"type": "rule", "item": r, "text": text_repr})
            tokenized_corpus.append(tokenize(text_repr))

        for f in self.active_facts:
            text_repr = f"{f.get('id', '')} {f.get('subject', '')} {f.get('value', '')} {f.get('permitted_wording', '')}"
            self.documents.append({"type": "fact", "item": f, "text": text_repr})
            tokenized_corpus.append(tokenize(text_repr))

        if tokenized_corpus:
            self.bm25 = BM25Okapi(tokenized_corpus)
        else:
            self.bm25 = None

    def retrieve(self, query: str, top_k: int = 8) -> list[dict[str, Any]]:
        """Retrieve top-k relevant active rules and facts for a query text."""
        if not self.bm25 or not self.documents:
            return []

        query_tokens = tokenize(query)
        if not query_tokens:
            return self.documents[:top_k]

        scores = self.bm25.get_scores(query_tokens)
        scored_docs = list(zip(self.documents, scores))
        scored_docs.sort(key=lambda x: x[1], reverse=True)

        return [doc for doc, score in scored_docs[:top_k] if score > 0.1]
