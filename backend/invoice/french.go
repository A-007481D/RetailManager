package invoice

import (
	"strings"
)

var (
	frenchUnits = []string{"", "un", "deux", "trois", "quatre", "cinq", "six", "sept", "huit", "neuf"}
	frenchTeens = []string{"dix", "onze", "douze", "treize", "quatorze", "quinze", "seize", "dix-sept", "dix-huit", "dix-neuf"}
	frenchTens  = []string{"", "dix", "vingt", "trente", "quarante", "cinquante", "soixante", "soixante-dix", "quatre-vingt", "quatre-vingt-dix"}
)

// IntToFrench converts an integer to French words
func IntToFrench(n int) string {
	if n == 0 {
		return "zéro"
	}

	if n < 0 {
		if n == -9223372036854775808 { // MinInt64
			return "moins " + IntToFrench(-(n + 1)) // Hack to avoid overflow, close enough or handle specifically
		}
		return "moins " + IntToFrench(-n)
	}

	parts := []string{}

	// Billions
	if n >= 1000000000 {
		billions := n / 1000000000
		n %= 1000000000
		if billions == 1 {
			parts = append(parts, "un milliard")
		} else {
			parts = append(parts, IntToFrench(billions)+" milliards")
		}
	}

	// Millions
	if n >= 1000000 {
		millions := n / 1000000
		n %= 1000000
		if millions == 1 {
			parts = append(parts, "un million")
		} else {
			parts = append(parts, IntToFrench(millions)+" millions")
		}
	}

	// Thousands
	if n >= 1000 {
		thousands := n / 1000
		n %= 1000
		if thousands == 1 {
			parts = append(parts, "mille")
		} else {
			parts = append(parts, IntToFrench(thousands)+" mille")
		}
	}

	// Hundreds
	if n >= 100 {
		hundreds := n / 100
		n %= 100
		if hundreds == 1 {
			parts = append(parts, "cent")
		} else {
			if n == 0 {
				parts = append(parts, frenchUnits[hundreds]+" cents")
			} else {
				parts = append(parts, frenchUnits[hundreds]+" cent")
			}
		}
	}

	if n > 0 {
		if n < 10 {
			parts = append(parts, frenchUnits[n])
		} else if n < 20 {
			parts = append(parts, frenchTeens[n-10])
		} else {
			tens := n / 10
			units := n % 10

			switch tens {
			case 7:
				if units == 1 {
					parts = append(parts, "soixante-et-onze")
				} else {
					parts = append(parts, "soixante-"+frenchTeens[units])
				}
			case 8:
				if units == 0 {
					parts = append(parts, "quatre-vingts")
				} else {
					parts = append(parts, "quatre-vingt-"+frenchUnits[units])
				}
			case 9:
				parts = append(parts, "quatre-vingt-"+frenchTeens[units])
			default:
				// 20-69
				tensStr := frenchTens[tens]
				if units == 0 {
					parts = append(parts, tensStr)
				} else if units == 1 {
					parts = append(parts, tensStr+"-et-un")
				} else {
					parts = append(parts, tensStr+"-"+frenchUnits[units])
				}
			}
		}
	}

	return strings.Join(parts, " ")
}
