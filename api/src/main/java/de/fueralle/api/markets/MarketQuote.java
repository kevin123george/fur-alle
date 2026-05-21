package de.fueralle.api.markets;

public record MarketQuote(
        String symbol,
        String name,
        double price,
        double change,
        double changePct,
        String currency,
        String marketState
) {}
