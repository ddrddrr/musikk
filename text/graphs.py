import pandas as pd
import matplotlib.pyplot as plt
import matplotlib.ticker as mtick


# def replace_commas_in_quotes(line: str) -> str:
#     """
#     Replace commas inside double-quoted fields with a pipe.
#     """
#     result = []
#     in_quotes = False
#     for ch in line:
#         if ch == '"':
#             in_quotes = not in_quotes
#             result.append(ch)
#         elif ch == "," and in_quotes:
#             result.append("|")
#         else:
#             result.append(ch)
#     return "".join(result)
#
#
# with open("res.csv", "r", encoding="utf-8") as infile, open(
#     "res2.csv", "w", encoding="utf-8"
# ) as outfile:
#     for line in infile:
#         outfile.write(replace_commas_in_quotes(line))

data = pd.read_csv("res2.csv")

data.drop("Timestamp", axis="columns", inplace=True)


def age(d):
    fig, ax = plt.subplots(figsize=(4, 3), subplot_kw=dict(aspect="equal"))
    counts = d["age"].dropna().value_counts()

    ax.pie(counts, labels=counts.index, autopct="%1.1f%%", startangle=140)
    ax.set_title("Age distribution among respondents")

    plt.show()


def audio_consumption_method(d):
    dummies = d["constumption method"].str.get_dummies(sep="|")
    df = pd.concat([d["age"], dummies], axis=1)

    counts = df.groupby("age")[dummies.columns].sum()
    group_sizes = data.groupby("age").size()
    percentages = counts.div(group_sizes, axis=0)

    fig, ax = plt.subplots(figsize=(12, 6))
    percentages.plot(kind="bar", ax=ax)

    ax.yaxis.set_major_formatter(mtick.PercentFormatter(xmax=1))
    ax.set_ylabel("Percentage of respondents")
    ax.set_xlabel("Age Group")
    ax.set_title("Audio Media Consumption by Age Group (multi-select)")
    ax.legend(title="Consumption Method", bbox_to_anchor=(1.05, 1), loc="upper left")

    plt.tight_layout()
    plt.show()


# age(data)
audio_consumption_method(data)
