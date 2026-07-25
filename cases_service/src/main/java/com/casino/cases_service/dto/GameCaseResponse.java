package com.casino.cases_service.dto;

import com.casino.cases_service.entities.GameCase;

import java.util.ArrayList;
import java.util.List;

public record GameCaseResponse(
        Long id,
        String name,
        String imageUrl,
        Long price
) {
    public static GameCaseResponse mapToResponse(GameCase gameCase){
        return new GameCaseResponse(
            gameCase.getId(),
            gameCase.getName(),
            gameCase.getImageUrl(),
            gameCase.getPrice()
        );
    }

    public static List<GameCaseResponse> mapToResponseList(List<GameCase> gameCases){
        List<GameCaseResponse> gameCaseResponse = new ArrayList<>();
        for (GameCase gCase : gameCases){
             gameCaseResponse.add(new GameCaseResponse(
                     gCase.getId(),
                     gCase.getName(),
                     gCase.getImageUrl(),
                     gCase.getPrice()
             ));
        }
        return gameCaseResponse;
    }
}
