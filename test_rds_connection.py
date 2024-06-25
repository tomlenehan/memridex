import psycopg2

try:
    connection = psycopg2.connect(
        user="qproot",
        password="qpdb1949",
        host="awseb-e-fcp66vtzd3-stack-awsebrdsdatabase-l9gxw7ftz3vj.cfhvy8rx7skb.us-east-1.rds.amazonaws.com",
        port="5432",
        database="memribox"
    )

    cursor = connection.cursor()
    cursor.execute("SELECT version();")
    record = cursor.fetchone()
    print("You are connected to - ", record, "\n")

except (Exception, psycopg2.Error) as error:
    print("Error while connecting to PostgreSQL", error)

finally:
    if connection:
        cursor.close()
        connection.close()
        print("PostgreSQL connection is closed")
