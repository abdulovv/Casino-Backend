package com.casino.cases_service.services;

import com.casino.cases_service.entities.CaseItem;
import com.casino.cases_service.exceptions.EmptyGameCaseException;
import com.casino.cases_service.exceptions.IncorrectSelectRewardAlgorithmException;
import com.casino.cases_service.exceptions.IncorrectTotalCaseItemsWeight;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.concurrent.ThreadLocalRandom;

@Service
public class RewardSelectionService {
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

        int randomWeight = ThreadLocalRandom.current().nextInt(totalWeight);
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
