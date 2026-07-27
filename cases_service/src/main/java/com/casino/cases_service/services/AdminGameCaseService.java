package com.casino.cases_service.services;

import com.casino.cases_service.clients.ItemServiceClient;
import com.casino.cases_service.clients.dto.ItemResponse;
import com.casino.cases_service.dto.CaseItemResponse;
import com.casino.cases_service.dto.AdminGameCaseResponse;
import com.casino.cases_service.dto.CreateCaseItemRequest;
import com.casino.cases_service.dto.CreateGameCaseRequest;
import com.casino.cases_service.dto.GameCaseDetailsResponse;
import com.casino.cases_service.dto.UpdateGameCaseRequest;
import com.casino.cases_service.entities.CaseItem;
import com.casino.cases_service.entities.GameCase;
import com.casino.cases_service.exceptions.InvalidCaseConfigurationException;
import com.casino.cases_service.exceptions.GameCaseNotFound;
import com.casino.cases_service.repositories.CaseItemRepository;
import com.casino.cases_service.repositories.GameCaseRepository;
import feign.FeignException;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Service
@AllArgsConstructor
public class AdminGameCaseService {
    private final GameCaseRepository gameCaseRepository;
    private final CaseItemRepository caseItemRepository;
    private final ItemServiceClient itemServiceClient;

    public List<AdminGameCaseResponse> findAll() {
        return gameCaseRepository.findAll()
                .stream()
                .map(AdminGameCaseResponse::mapToResponse)
                .toList();
    }

    @Transactional
    public GameCaseDetailsResponse create(CreateGameCaseRequest request) {
        validateWeightsAndDuplicates(request.items());
        Map<Long, ItemResponse> catalogItems = loadCatalogItems(request.items());

        GameCase gameCase = new GameCase();
        gameCase.setName(request.name());
        gameCase.setImageUrl(request.imageUrl());
        gameCase.setPrice(request.price());
        gameCase.setActive(request.active());
        gameCaseRepository.save(gameCase);

        List<CaseItem> caseItems = new ArrayList<>();
        for (CreateCaseItemRequest requestedItem : request.items()) {
            CaseItem caseItem = new CaseItem();
            caseItem.setGameCase(gameCase);
            caseItem.setItemId(requestedItem.itemId());
            caseItem.setWeight(requestedItem.weight());
            caseItems.add(caseItem);
        }
        caseItemRepository.saveAll(caseItems);

        List<CaseItemResponse> responses = caseItems.stream()
                .map(caseItem -> CaseItemResponse.mapToResponse(
                        caseItem,
                        catalogItems.get(caseItem.getItemId())
                ))
                .toList();
        return GameCaseDetailsResponse.mapToResponse(gameCase, responses);
    }

    @Transactional
    public GameCaseDetailsResponse update(
            Long caseId,
            UpdateGameCaseRequest request
    ) {
        validateWeightsAndDuplicates(request.items());
        Map<Long, ItemResponse> catalogItems = loadCatalogItems(request.items());

        GameCase gameCase = gameCaseRepository.findById(caseId)
                .orElseThrow(() -> new GameCaseNotFound(caseId));
        gameCase.setName(request.name());
        gameCase.setImageUrl(request.imageUrl());
        gameCase.setPrice(request.price());
        gameCase.setActive(request.active());
        gameCaseRepository.save(gameCase);

        caseItemRepository.deleteAllByGameCaseId(caseId);
        caseItemRepository.flush();

        List<CaseItem> caseItems = new ArrayList<>();
        for (CreateCaseItemRequest requestedItem : request.items()) {
            CaseItem caseItem = new CaseItem();
            caseItem.setGameCase(gameCase);
            caseItem.setItemId(requestedItem.itemId());
            caseItem.setWeight(requestedItem.weight());
            caseItems.add(caseItem);
        }
        caseItemRepository.saveAll(caseItems);

        List<CaseItemResponse> responses = caseItems.stream()
                .map(caseItem -> CaseItemResponse.mapToResponse(
                        caseItem,
                        catalogItems.get(caseItem.getItemId())
                ))
                .toList();
        return GameCaseDetailsResponse.mapToResponse(gameCase, responses);
    }

    private void validateWeightsAndDuplicates(
            List<CreateCaseItemRequest> items
    ) {
        Set<Long> itemIds = new HashSet<>();
        int totalWeight = 0;

        for (CreateCaseItemRequest item : items) {
            if (!itemIds.add(item.itemId())) {
                throw new InvalidCaseConfigurationException(
                        "Case contains duplicate itemId: " + item.itemId()
                );
            }
            totalWeight += item.weight();
        }

        if (totalWeight != 100) {
            throw new InvalidCaseConfigurationException(
                    "Reward percentages must total exactly 100%"
            );
        }
    }

    private Map<Long, ItemResponse> loadCatalogItems(
            List<CreateCaseItemRequest> items
    ) {
        Map<Long, ItemResponse> catalogItems = new LinkedHashMap<>();

        for (CreateCaseItemRequest item : items) {
            try {
                catalogItems.put(
                        item.itemId(),
                        itemServiceClient.getItemById(item.itemId())
                );
            } catch (FeignException.NotFound exception) {
                throw new InvalidCaseConfigurationException(
                        "Item not found: " + item.itemId()
                );
            }
        }

        return catalogItems;
    }
}
