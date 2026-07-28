package com.casino.cases_service.services;

import com.casino.cases_service.entities.CaseItem;
import com.casino.cases_service.exceptions.EmptyGameCaseException;
import com.casino.cases_service.exceptions.IncorrectSelectRewardAlgorithmException;
import com.casino.cases_service.exceptions.IncorrectTotalCaseItemsWeight;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.util.List;

@Service
public class RewardSelectionService {
    private final SecureRandom secureRandom = new SecureRandom();

    public CaseItem selectReward(List<CaseItem> caseItems) {
        if (caseItems == null || caseItems.isEmpty()) {
            throw new EmptyGameCaseException();
        }

        int totalWeight = 0;
        for (CaseItem caseItem : caseItems) {
            totalWeight += caseItem.getWeight();
        }

        if (totalWeight != 100) {
            throw new IncorrectTotalCaseItemsWeight();
        }

        int randomWeight = secureRandom.nextInt(totalWeight);
        int accumulatedWeight = 0;

        for (CaseItem caseItem : caseItems) {
            accumulatedWeight += caseItem.getWeight();
            if (randomWeight < accumulatedWeight) {
                return caseItem;
            }
        }

        throw new IncorrectSelectRewardAlgorithmException();
    }
}
