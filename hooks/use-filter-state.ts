import { useQuery } from "@tanstack/react-query"
import { useCallback, useState } from "react"
import { FILTER_ALL } from "@/lib/constants"
import { fetchAreas } from "@/lib/fetch-areas"
import { fetchPrefectures } from "@/lib/fetch-prefectures"

export function useFilterState() {
  const [selectedArea, setSelectedArea] = useState<string | undefined>(
    undefined,
  )
  const [selectedPrefecture, setSelectedPrefecture] = useState<
    string | undefined
  >(undefined)

  const { data: areas = [] } = useQuery({
    queryKey: ["areas"],
    queryFn: fetchAreas,
    staleTime: Number.POSITIVE_INFINITY,
  })

  const { data: fetchedPrefectures = [] } = useQuery({
    queryKey: ["prefectures", selectedArea],
    queryFn: () => fetchPrefectures(selectedArea ?? ""),
    enabled: !!selectedArea,
    staleTime: Number.POSITIVE_INFINITY,
  })

  const prefectures = selectedArea ? fetchedPrefectures : []

  const handleAreaChange = useCallback((value: string) => {
    if (value === FILTER_ALL) {
      setSelectedArea(undefined)
      setSelectedPrefecture(undefined)
    } else {
      setSelectedArea(value)
      setSelectedPrefecture(undefined)
    }
  }, [])

  const handlePrefectureChange = useCallback((value: string) => {
    if (value === FILTER_ALL) {
      setSelectedPrefecture(undefined)
    } else {
      setSelectedPrefecture(value)
    }
  }, [])

  const resetFilter = useCallback(() => {
    setSelectedArea(undefined)
    setSelectedPrefecture(undefined)
  }, [])

  const isFilterActive = selectedArea !== undefined

  return {
    areas,
    prefectures,
    selectedArea,
    selectedPrefecture,
    handleAreaChange,
    handlePrefectureChange,
    resetFilter,
    isFilterActive,
  }
}
